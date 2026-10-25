/**
 * Stackra file contract:
 * Purpose: unit tests of `decimalProduct`: the exact product of numbers and decimal strings with no float error, and
 *          its refusals.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { decimalProduct } from "#core/functions/decimal-product.function";

describe("decimalProduct", () => {
  it("multiplies exactly", () => {
    expect(decimalProduct(12.5, 0.875)).toBe("10.9375");
    expect(decimalProduct(12.5, "0.875", "251.42")).toBe("2749.90625");
    expect(decimalProduct(0.1, 0.2)).toBe("0.02"); // 0.1 * 0.2 is 0.020000000000000004 in floats
    expect(decimalProduct("-1.5", 2)).toBe("-3");
    expect(decimalProduct(7)).toBe("7");
  });

  it("refuses no factor and a non-decimal", () => {
    expect(() => decimalProduct()).toThrow(RangeError);
    expect(() => decimalProduct(1, "x")).toThrow(RangeError);
    expect(() => decimalProduct(Number.NaN)).toThrow(RangeError);
  });
});
