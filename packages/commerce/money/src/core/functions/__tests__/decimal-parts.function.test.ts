/**
 * Stackra file contract:
 * Purpose: unit tests of `decimalParts`: strings are read as written, numbers as the decimal they print as (exponent
 *          forms included), and non-decimals are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { decimalParts } from "#core/functions/decimal-parts.function";

describe("decimalParts", () => {
  it("reads strings digit for digit", () => {
    expect(decimalParts("12.50")).toEqual({ digits: 1250n, scale: 2 });
    expect(decimalParts("-0.005")).toEqual({ digits: -5n, scale: 3 });
    expect(decimalParts("7")).toEqual({ digits: 7n, scale: 0 });
  });

  it("reads numbers as they print, exponents included", () => {
    expect(decimalParts(0.875)).toEqual({ digits: 875n, scale: 3 });
    expect(decimalParts(1e-7)).toEqual({ digits: 1n, scale: 7 });
    expect(decimalParts(1e21)).toEqual({ digits: 10n ** 21n, scale: 0 });
    expect(decimalParts(-2.5)).toEqual({ digits: -25n, scale: 1 });
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, "1,5", "abc", "", ".5", "1e3"])(
    "refuses %s",
    (value) => {
      expect(() => decimalParts(value)).toThrow(RangeError);
    },
  );
});
