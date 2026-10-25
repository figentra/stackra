/**
 * Stackra file contract:
 * Purpose: unit tests of `RULE_VERSION_PATTERN`: dotted whole numbers pass; a `v` prefix, a pre-release tag, an empty
 *          part and words fail.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0337 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { RULE_VERSION_PATTERN } from "#core/constants/rule-version-pattern.constant";

describe("RULE_VERSION_PATTERN", () => {
  it("accepts dotted whole numbers", () => {
    for (const version of ["2", "2.4", "2.4.0", "10.0.12"])
      expect(RULE_VERSION_PATTERN.test(version)).toBe(true);
  });

  it("refuses anything else", () => {
    for (const version of ["v2.4.0", "2.4.0-beta", "2..4", "", "latest"])
      expect(RULE_VERSION_PATTERN.test(version)).toBe(false);
  });
});
