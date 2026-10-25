/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CspConfig`: the defaults (no additions, enforcing), the derived key `csp`, a host
 *          override in the template's shape (`override` members under the `BaseCspConfig` alias) builds and
 *          validates, and a source that would loosen the policy fails the boot with `ConfigInvalidError`.
 * Boundary: test only; builds through @stackra/config's `buildConfig`, as `createApp` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 19
 *                     and 20).
 */
import { buildConfig, Config, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { CspConfig } from "#config/csp.config";

/** The package class under the alias a host imports it by. */
const BaseCspConfig = CspConfig;

/** The template web app's override. */
class HostCspConfig extends BaseCspConfig {
  override extraConnectSrc: string[] = [
    "https://eu.i.posthog.com",
    "https://challenges.cloudflare.com",
  ];

  override extraFrameSrc: string[] = ["https://challenges.cloudflare.com"];

  override reportOnly = true;
}

describe("CspConfig", () => {
  it("holds no additions and enforces by default", () => {
    const config = buildConfig(CspConfig);
    expect(config).toBeInstanceOf(Config);
    expect(Object.isFrozen(config)).toBe(true);
    expect({ ...config }).toEqual({
      extraConnectSrc: [],
      extraFrameSrc: [],
      extraImgSrc: [],
      reportOnly: false,
      hstsMaxAgeSeconds: 63_072_000,
      hstsIncludeSubDomains: true,
      hstsPreload: false,
      referrerPolicy: "strict-origin-when-cross-origin",
      permissionsAllow: {},
    });
  });

  it("types its fields on the class", () => {
    const config = new CspConfig();
    expectTypeOf(config.extraConnectSrc).toEqualTypeOf<string[]>();
    expectTypeOf(config.extraFrameSrc).toEqualTypeOf<string[]>();
    expectTypeOf(config.extraImgSrc).toEqualTypeOf<string[]>();
    expectTypeOf(config.reportOnly).toEqualTypeOf<boolean>();
    expectTypeOf(config.hstsMaxAgeSeconds).toEqualTypeOf<number>();
  });

  it("derives the key csp, for the base and for a host override", () => {
    expect(configKey(CspConfig, "csp")).toBe("csp");
    expect(configKey(HostCspConfig, "csp")).toBe("csp");
  });

  it("builds a host override on top of the defaults", () => {
    const config = buildConfig(HostCspConfig);
    expect(config).toBeInstanceOf(CspConfig);
    expect(config.extraConnectSrc).toEqual([
      "https://eu.i.posthog.com",
      "https://challenges.cloudflare.com",
    ]);
    expect(config.extraFrameSrc).toEqual(["https://challenges.cloudflare.com"]);
    expect(config.extraImgSrc).toEqual([]);
    expect(config.reportOnly).toBe(true);
  });

  it.each([
    ["'unsafe-inline'"],
    ["*"],
    ["https://a.example; script-src *"],
    ["a b"],
    ["a,b"],
    [""],
  ])("refuses the loosening source %j at boot", (source) => {
    expect(() => buildConfig(CspConfig, { values: { extraConnectSrc: [source] } })).toThrow(
      ConfigInvalidError,
    );
  });
});
