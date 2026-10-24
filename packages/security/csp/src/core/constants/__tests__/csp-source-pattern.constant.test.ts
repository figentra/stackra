/**
 * Stackra file contract:
 * Purpose: unit tests of `CSP_SOURCE_PATTERN`: one host or scheme source matches; separators, quotes, whitespace, the
 *          bare wildcard and the empty string do not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0237.
 */
import { describe, expect, it } from "@stackra/testing";

import { CSP_SOURCE_PATTERN } from "#core/constants/csp-source-pattern.constant";

describe("CSP_SOURCE_PATTERN", () => {
  it.each([
    ["https:"],
    ["data:"],
    ["cdn.acme.example"],
    ["*.acme.example"],
    ["https://api.acme.example:8443/v1"],
  ])("matches %j", (source) => {
    expect(CSP_SOURCE_PATTERN.test(source)).toBe(true);
  });

  it.each([["*"], ["'self'"], ["a;b"], ["a,b"], ["a b"], ["a\tb"], ["a\nb"], [""]])(
    "refuses %j",
    (source) => {
      expect(CSP_SOURCE_PATTERN.test(source)).toBe(false);
    },
  );
});
