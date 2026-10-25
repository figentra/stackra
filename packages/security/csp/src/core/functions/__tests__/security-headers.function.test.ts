/**
 * Stackra file contract:
 * Purpose: unit tests of `securityHeaders`: the defaults turn HSTS, nosniff, the strict referrer policy, every baseline
 *          feature off, the opener policy and the frame refusal on; a host's allowances and HSTS choices print as
 *          configured; preload needs subdomains and a year; a loosening allowance throws.
 * Boundary: test only; builds the configuration through @stackra/config's `buildConfig`, as `createApp` does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237; owner round 3 #34.
 */
import { buildConfig } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { CspConfig } from "#config/csp.config";
import { securityHeaders } from "#core/functions/security-headers.function";

describe("securityHeaders", () => {
  it("turns every header on by default", () => {
    expect(securityHeaders(buildConfig(CspConfig))).toEqual({
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy":
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), display-capture=()",
      "Cross-Origin-Opener-Policy": "same-origin",
      "X-Frame-Options": "DENY",
    });
  });

  it("prints a host's allowances and HSTS choices", () => {
    const config = buildConfig(CspConfig, {
      values: {
        hstsMaxAgeSeconds: 31_536_000,
        hstsPreload: true,
        referrerPolicy: "no-referrer",
        permissionsAllow: { camera: ["self", "https://scan.acme.example/x", "self"] },
      },
    });
    const headers = securityHeaders(config);
    expect(headers["Strict-Transport-Security"]).toBe(
      "max-age=31536000; includeSubDomains; preload",
    );
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["Permissions-Policy"]).toContain('camera=(self "https://scan.acme.example")');
    expect(headers["Permissions-Policy"]).toContain("microphone=()");
  });

  it("leaves preload out without subdomains or a year of max-age", () => {
    const short = buildConfig(CspConfig, { values: { hstsMaxAgeSeconds: 600, hstsPreload: true } });
    expect(securityHeaders(short)["Strict-Transport-Security"]).toBe(
      "max-age=600; includeSubDomains",
    );
    const narrow = buildConfig(CspConfig, {
      values: { hstsIncludeSubDomains: false, hstsPreload: true },
    });
    expect(securityHeaders(narrow)["Strict-Transport-Security"]).toBe("max-age=63072000");
  });

  it("refuses an allowance that is not one host source", () => {
    const config = { ...buildConfig(CspConfig), permissionsAllow: { camera: ["a b"] } };
    expect(() => securityHeaders(config)).toThrow(TypeError);
  });
});
