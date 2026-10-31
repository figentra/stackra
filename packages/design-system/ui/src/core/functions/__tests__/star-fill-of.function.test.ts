/**
 * Stackra file contract:
 * Purpose: proves `starFillOf` fills the stars before the value, part of the one it ends in, and none after.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { starFillOf } from "#core/functions/star-fill-of.function";

describe("starFillOf", () => {
  it("fills whole, part and none", () => {
    expect([1, 2, 3, 4, 5].map((position) => starFillOf(3.5, position))).toEqual([1, 1, 1, 0.5, 0]);
    expect(starFillOf(0, 1)).toBe(0);
  });
});
