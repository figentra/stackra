/**
 * Stackra file contract:
 * Purpose: unit tests of `addSafe`: the exact sum of two whole amounts, and a refusal, not a rounded value, when the sum
 *          leaves the safe integers.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (integer minor units).
 */
import { describe, expect, it } from "@stackra/testing";

import { addSafe } from "#node/functions/add-safe.function";

describe("addSafe", () => {
  it("adds whole amounts exactly up to the largest safe integer", () => {
    expect(addSafe(100, -30)).toBe(70);
    expect(addSafe(0, 0)).toBe(0);
    expect(addSafe(Number.MAX_SAFE_INTEGER - 1, 1)).toBe(Number.MAX_SAFE_INTEGER);
    expect(addSafe(Number.MIN_SAFE_INTEGER + 1, -1)).toBe(Number.MIN_SAFE_INTEGER);
    expect(addSafe(Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER)).toBe(0);
  });

  it("refuses a sum beyond the safe integers, in either direction, instead of rounding it", () => {
    expect(() => addSafe(Number.MAX_SAFE_INTEGER, 1)).toThrow(RangeError);
    expect(() => addSafe(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toThrow(RangeError);
    expect(() => addSafe(Number.MIN_SAFE_INTEGER, -1)).toThrow(RangeError);
  });
});
