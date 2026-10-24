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

  it("refuses a report-only flag that is not a boolean", () => {
    expect(CSP_OPTIONS_SCHEMA.safeParse({ reportOnly: "true" }).success).toBe(false);
  });
});
