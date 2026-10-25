/**
 * Stackra file contract:
 * Purpose: unit tests of `isOlderRuleVersion`: part-by-part numeric comparison (`2.10` after `2.9`), missing parts as
 *          zero, equal and newer versions accepted, and a malformed version treated as older.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0337 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { isOlderRuleVersion } from "#core/functions/is-older-rule-version.function";

describe("isOlderRuleVersion", () => {
  it("compares dotted whole numbers part by part", () => {
    expect(isOlderRuleVersion("2.3.9", "2.4.0")).toBe(true);
    expect(isOlderRuleVersion("2.9", "2.10")).toBe(true);
    expect(isOlderRuleVersion("2.10", "2.9")).toBe(false);
    expect(isOlderRuleVersion("3", "2.9.9")).toBe(false);
  });

  it("accepts an equal version, missing parts counting as zero", () => {
    expect(isOlderRuleVersion("2.4.0", "2.4.0")).toBe(false);
    expect(isOlderRuleVersion("2", "2.0.0")).toBe(false);
    expect(isOlderRuleVersion("2.4", "2.4.1")).toBe(true);
  });

  it("treats a malformed version as older", () => {
    expect(isOlderRuleVersion("v2.4.0", "1")).toBe(true);
    expect(isOlderRuleVersion("", "1")).toBe(true);
  });
});
