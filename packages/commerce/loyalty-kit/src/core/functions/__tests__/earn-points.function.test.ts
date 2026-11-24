/**
 * Stackra file contract:
 * Purpose: unit tests of `earnPoints`: the points of an amount at a rate are the exact floor of amount × rate (the case a
 *          binary float gets wrong, 0.29 × 100, and every rate of one and two decimals against integer arithmetic),
 *          exponent-form rates, a negative amount rounding down, and the refusals.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (integer minor units, no floats); ADR 0454 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { earnPoints } from "#core/functions/earn-points.function";

describe("earnPoints", () => {
  it("is exact where Math.floor of a float product is one short", () => {
    // 0.29 * 100 is 28.999999999999996 in binary floating point
    expect(Math.floor(100 * 0.29)).toBe(28);
    expect(earnPoints(100, 0.29)).toBe(29);
    expect(earnPoints(200, 0.29)).toBe(58);
    expect(earnPoints(3000, 0.009)).toBe(27);
  });

  it("keeps the ordinary rates", () => {
    expect(earnPoints(5000, 0.1)).toBe(500);
    expect(earnPoints(9, 0.1)).toBe(0);
    expect(earnPoints(5000, 0.02)).toBe(100);
    expect(earnPoints(5000, 0.01)).toBe(50);
    expect(earnPoints(1234, 1)).toBe(1234);
    expect(earnPoints(0, 0.5)).toBe(0);
    expect(earnPoints(777, 0)).toBe(0);
  });

  it("equals integer arithmetic for every rate of two decimals and every amount up to 5 000", () => {
    const wrong: string[] = [];
    for (let hundredths = 1; hundredths <= 100; hundredths += 1) {
      const rate = hundredths / 100;
      for (let amount = 1; amount <= 5000; amount += 1)
        if (earnPoints(amount, rate) !== Math.floor((amount * hundredths) / 100))
          wrong.push(`${amount} at ${rate}`);
    }
    expect(wrong).toEqual([]);
  });

  it("equals integer arithmetic for every rate of three decimals and a spread of amounts", () => {
    const wrong: string[] = [];
    for (let thousandths = 1; thousandths <= 1000; thousandths += 1) {
      const rate = thousandths / 1000;
      for (const amount of [1, 7, 99, 100, 101, 999, 1000, 1001, 3000, 12_345, 99_999, 100_000])
        if (earnPoints(amount, rate) !== Number((BigInt(amount) * BigInt(thousandths)) / 1000n))
          wrong.push(`${amount} at ${rate}`);
    }
    expect(wrong).toEqual([]);
  });

  it("reads a rate printed with an exponent", () => {
    expect(String(1e-7)).toBe("1e-7");
    expect(earnPoints(10_000_000, 1e-7)).toBe(1);
    expect(earnPoints(9_999_999, 1e-7)).toBe(0);
    expect(earnPoints(3, 1.5e-6)).toBe(0);
    expect(earnPoints(1_000_000, 1.5e-6)).toBe(1);
  });

  it("rounds a negative amount down, as a correction would", () => {
    expect(earnPoints(-100, 0.29)).toBe(-29);
    expect(earnPoints(-1, 0.5)).toBe(-1);
    expect(earnPoints(-10, 0.1)).toBe(-1);
  });

  it("refuses an amount or a rate it cannot compute exactly", () => {
    expect(() => earnPoints(1.5, 0.1)).toThrow(RangeError);
    expect(() => earnPoints(Number.NaN, 0.1)).toThrow(RangeError);
    expect(() => earnPoints(2 ** 53, 0.1)).toThrow(RangeError);
    expect(() => earnPoints(100, -0.1)).toThrow(RangeError);
    expect(() => earnPoints(100, Number.NaN)).toThrow(RangeError);
    expect(() => earnPoints(100, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("refuses a result beyond the safe integers instead of rounding it", () => {
    expect(() => earnPoints(Number.MAX_SAFE_INTEGER, 2)).toThrow(RangeError);
    expect(earnPoints(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => earnPoints(1, 1e21)).toThrow(RangeError);
  });
});
