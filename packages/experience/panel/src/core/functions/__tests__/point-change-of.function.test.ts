/**
 * Stackra file contract:
 * Purpose: unit tests of `pointChangeOf`: the change of a ratio in percentage points, a change from a zero previous rate,
 *          and null without a value or a previous value.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 15).
 */
import { describe, expect, it } from "@stackra/testing";

import { pointChangeOf } from "#core/functions/point-change-of.function";

/** The trend of a percent metric, in percentage points. */
describe("pointChangeOf", () => {
  /** A rate that moves from 60% to 67% is up 7 points, not up 11.7%. */
  it("returns the change in percentage points", () => {
    expect(pointChangeOf({ value: 0.67, previous: 0.6 })).toBeCloseTo(7);
    expect(pointChangeOf({ value: 0.5, previous: 0.75 })).toBeCloseTo(-25);
    expect(pointChangeOf({ value: 0.4, previous: 0 })).toBeCloseTo(40);
  });

  /** Without both ratios there is nothing to compare. */
  it("returns null without a value or a previous value", () => {
    expect(pointChangeOf({ value: null, previous: 0.5 })).toBeNull();
    expect(pointChangeOf({ value: 0.5, previous: null })).toBeNull();
  });
});
