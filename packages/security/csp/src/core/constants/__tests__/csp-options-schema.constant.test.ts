/**
 * Stackra file contract:
 * Purpose: unit tests of `CSP_OPTIONS_SCHEMA`: the defaults apply to an empty input, host and scheme sources pass,
 *          and every source that would open a directive, add a keyword or allow everything fails.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { CSP_OPTIONS_SCHEMA } from "#core/constants/csp-options-schema.constant";

describe("CSP_OPTIONS_SCHEMA", () => {
  it("applies the defaults", () => {
    expect(CSP_OPTIONS_SCHEMA.parse({})).toEqual({
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

  it("accepts host and scheme sources", () => {
    const sources = [
      "https://eu.i.posthog.com",
      "*.acme.example",
      "wss:",
      "media.acme.example:8443",
    ];
    const parsed = CSP_OPTIONS_SCHEMA.parse({
      extraConnectSrc: sources,
      extraFrameSrc: sources,
      extraImgSrc: sources,
      reportOnly: true,
    });
    expect(parsed.extraConnectSrc).toEqual(sources);
    expect(parsed.reportOnly).toBe(true);
  });

  it.each([["'unsafe-eval'"], ["*"], ["a.example;"], ["a.example b.example"], ["a,b"], [""]])(
    "refuses %j in every list",
    (source) => {
      for (const field of ["extraConnectSrc", "extraFrameSrc", "extraImgSrc"]) {
        expect(CSP_OPTIONS_SCHEMA.safeParse({ [field]: [source] }).success).toBe(false);
      }
    },
  );

  it("accepts the strict referrer policies and refuses the loose ones", () => {
    expect(CSP_OPTIONS_SCHEMA.safeParse({ referrerPolicy: "no-referrer" }).success).toBe(true);
    for (const policy of ["unsafe-url", "no-referrer-when-downgrade", "anything"]) {
      expect(CSP_OPTIONS_SCHEMA.safeParse({ referrerPolicy: policy }).success).toBe(false);
    }
  });

  it("allows a baseline feature to self or a host, never to everyone or an unknown feature", () => {
    expect(
      CSP_OPTIONS_SCHEMA.safeParse({ permissionsAllow: { camera: ["self", "https://a.example"] } })
        .success,
    ).toBe(true);
    expect(CSP_OPTIONS_SCHEMA.safeParse({ permissionsAllow: { camera: ["*"] } }).success).toBe(
      false,
    );
    expect(CSP_OPTIONS_SCHEMA.safeParse({ permissionsAllow: { vibrate: ["self"] } }).success).toBe(
      false,
    );
  });

  it("refuses a negative HSTS max-age", () => {
    expect(CSP_OPTIONS_SCHEMA.safeParse({ hstsMaxAgeSeconds: -1 }).success).toBe(false);
  });

  it("refuses a report-only flag that is not a boolean", () => {
    expect(CSP_OPTIONS_SCHEMA.safeParse({ reportOnly: "true" }).success).toBe(false);
  });
});
