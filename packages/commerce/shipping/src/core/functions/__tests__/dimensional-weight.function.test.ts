/**
 * Stackra file contract:
 * Purpose: unit tests of `dimensionalWeight`: volume over the given factor in whole grams rounded up, and the refusals
 *          (bad dimensions, weight, factor, a volume past the safe integer limit).
 * Boundary: test only; the factors are arbitrary test inputs, never a carrier's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0363 (decision 9); ADR 0369 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import type { Parcel } from "#contracts/types/parcel.type";
import { dimensionalWeight } from "#core/functions/dimensional-weight.function";

const box: Parcel = { lengthMm: 400, widthMm: 300, heightMm: 200, weightG: 1 };

describe("dimensionalWeight", () => {
  it("divides the volume in mm³ by the factor in cm³ per kg, giving grams", () => {
    // 24 000 000 mm³ = 24 000 cm³; at 4 000 cm³/kg that is 6 kg.
    expect(dimensionalWeight(box, 4_000)).toBe(6_000);
  });

  it("rounds a fraction of a gram up", () => {
    expect(dimensionalWeight({ lengthMm: 1, widthMm: 1, heightMm: 7, weightG: 1 }, 2)).toBe(4);
  });

  it("takes a fractional factor", () => {
    expect(dimensionalWeight({ lengthMm: 10, widthMm: 10, heightMm: 10, weightG: 1 }, 2.5)).toBe(
      400,
    );
  });

  it.each(["lengthMm", "widthMm", "heightMm", "weightG"] as const)("refuses a bad %s", (field) => {
    for (const value of [0, -1, 1.5, Number.NaN])
      expect(() => dimensionalWeight({ ...box, [field]: value }, 4_000)).toThrow(RangeError);
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])("refuses factor %s", (factor) => {
    expect(() => dimensionalWeight(box, factor)).toThrow(RangeError);
  });

  it("refuses a volume past the safe integer limit", () => {
    const huge = { lengthMm: 1e6, widthMm: 1e6, heightMm: 1e6, weightG: 1 };
    expect(() => dimensionalWeight(huge, 4_000)).toThrow(RangeError);
  });
});
