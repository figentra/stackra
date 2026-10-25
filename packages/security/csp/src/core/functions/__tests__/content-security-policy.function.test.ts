/**
 * Stackra file contract:
 * Purpose: unit tests of `contentSecurityPolicy`: the baseline alone, the nonce on `script-src` and `style-src` only,
 *          the runtime's and the configuration's origins on `connect-src` (a URL by its origin, each once), the
 *          `frame-src` and `img-src` additions, fixed directives that no addition reaches, and refusal of a malformed
 *          nonce or a loosening source.
 * Boundary: test only; configurations are host overrides in the template's shape.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237; ADR 0251.
 */
import { describe, expect, it } from "@stackra/testing";

import { CspConfig } from "#config/csp.config";
import { contentSecurityPolicy } from "#core/functions/content-security-policy.function";

/** The template web app's override. */
class SiteCspConfig extends CspConfig {
  override extraConnectSrc: string[] = [
    "https://eu.i.posthog.com",
    "https://challenges.cloudflare.com",
  ];

  override extraFrameSrc: string[] = ["https://challenges.cloudflare.com"];

  override extraImgSrc: string[] = ["https://media.acme.example/images"];
}

/** The policy as a directive-to-sources map. */
function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy.split("; ").map((part) => {
      const [name = "", ...sources] = part.split(" ");
      return [name, sources];
    }),
  );
}

describe("contentSecurityPolicy", () => {
  it("prints the baseline when nothing is added", () => {
    expect(contentSecurityPolicy(new CspConfig())).toBe(
      [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "style-src-attr 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
    );
  });

  it("adds the nonce to script-src and style-src only", () => {
    const policy = directives(
      contentSecurityPolicy(new CspConfig(), { nonce: "q2Xr0f8bT1k1m3c5H0pW9A==" }),
    );
    expect(policy.get("script-src")).toEqual(["'self'", "'nonce-q2Xr0f8bT1k1m3c5H0pW9A=='"]);
    expect(policy.get("style-src")).toEqual(["'self'", "'nonce-q2Xr0f8bT1k1m3c5H0pW9A=='"]);
    expect(policy.get("default-src")).toEqual(["'self'"]);
    expect(policy.get("style-src-attr")).toEqual(["'unsafe-inline'"]);
  });

  it("adds the runtime's origins, then the configuration's, to connect-src once each", () => {
    const policy = directives(
      contentSecurityPolicy(new SiteCspConfig(), {
        connect: ["https://api.acme.example/v1", "https://challenges.cloudflare.com/"],
        nonce: "abc",
      }),
    );
    expect(policy.get("connect-src")).toEqual([
      "'self'",
      "https://api.acme.example",
      "https://challenges.cloudflare.com",
      "https://eu.i.posthog.com",
    ]);
  });

  it("adds the configuration's frame-src and img-src sources", () => {
    const policy = directives(contentSecurityPolicy(new SiteCspConfig()));
    expect(policy.get("frame-src")).toEqual(["'self'", "https://challenges.cloudflare.com"]);
    expect(policy.get("img-src")).toEqual([
      "'self'",
      "data:",
      "blob:",
      "https://media.acme.example",
    ]);
  });

  it("keeps every fixed directive whatever is added", () => {
    const policy = directives(
      contentSecurityPolicy(new SiteCspConfig(), {
        connect: ["wss://rt.acme.example"],
        nonce: "abc",
      }),
    );
    expect(policy.get("object-src")).toEqual(["'none'"]);
    expect(policy.get("base-uri")).toEqual(["'none'"]);
    expect(policy.get("form-action")).toEqual(["'self'"]);
    expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
    expect(policy.get("font-src")).toEqual(["'self'"]);
    expect([...policy.keys()]).toHaveLength(12);
  });

  it.each([["abc'; script-src *"], ["abc def"], [""]])("refuses the nonce %j", (nonce) => {
    expect(() => contentSecurityPolicy(new CspConfig(), { nonce })).toThrow(TypeError);
  });

  it("refuses a loosening source from the runtime or the configuration", () => {
    expect(() => contentSecurityPolicy(new CspConfig(), { connect: ["'unsafe-inline'"] })).toThrow(
      TypeError,
    );

    class LooseCspConfig extends CspConfig {
      override extraImgSrc: string[] = ["*"];
    }
    expect(() => contentSecurityPolicy(new LooseCspConfig())).toThrow(TypeError);
  });
});
