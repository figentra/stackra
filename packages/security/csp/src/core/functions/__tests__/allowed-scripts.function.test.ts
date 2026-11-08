/**
 * Stackra file contract:
 * Purpose: unit tests of `allowedScripts` and its effect on the policy: a `necessary` script always loads, a gated one
 *          only with its category granted, an unlisted one never; without consent only `necessary` loads; a wildcard,
 *          a path, http or a bad category is refused at boot.
 * Boundary: test only; builds the configuration through @stackra/config's `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0298; STA-2562.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { CspConfig } from "#config/csp.config";
import { allowedScripts } from "#core/functions/allowed-scripts.function";
import { contentSecurityPolicy } from "#core/functions/content-security-policy.function";

/** A checkout surface: the payment SDK always, an ad pixel with marketing consent, analytics with analytics consent. */
const checkout = buildConfig(CspConfig, {
  values: {
    thirdPartyScripts: {
      "https://js.stripe.com": "necessary",
      "https://connect.facebook.net": "marketing",
      "https://cdn.analytics.example": "analytics",
    },
  },
});

/** The `script-src` sources of `config` for `consent`. */
const scriptSrc = (consent?: readonly string[]): string[] =>
  contentSecurityPolicy(checkout, consent === undefined ? {} : { consent })
    .split("; ")
    .find((part) => part.startsWith("script-src "))
    ?.split(" ")
    .slice(1) ?? [];

describe("allowedScripts", () => {
  it("loads only necessary scripts without consent", () => {
    expect(allowedScripts(checkout)).toEqual(["https://js.stripe.com"]);
    expect(scriptSrc()).toEqual(["'self'", "https://js.stripe.com"]);
  });

  it("loads a gated script only with its category granted", () => {
    expect(allowedScripts(checkout, ["analytics"])).toEqual([
      "https://js.stripe.com",
      "https://cdn.analytics.example",
    ]);
    expect(scriptSrc(["marketing", "analytics"])).toEqual([
      "'self'",
      "https://js.stripe.com",
      "https://connect.facebook.net",
      "https://cdn.analytics.example",
    ]);
  });

  it("never loads an unlisted script, whatever the consent", () => {
    const sources = scriptSrc(["marketing", "analytics", "crash_replay"]);
    expect(sources).not.toContain("https://evil.example");
    expect(sources.some((source) => source.includes("*"))).toBe(false);
  });

  it("refuses a wildcard, a path, http or a bad category at boot", () => {
    for (const thirdPartyScripts of [
      { "https://*.stripe.com": "necessary" },
      { "*": "necessary" },
      { "https://js.stripe.com/v3": "necessary" },
      { "http://js.stripe.com": "necessary" },
      { "https://js.stripe.com": "Marketing!" },
    ])
      expect(() => buildConfig(CspConfig, { values: { thirdPartyScripts } })).toThrow();
  });
});
