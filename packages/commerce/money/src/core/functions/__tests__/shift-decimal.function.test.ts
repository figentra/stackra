/**
 * Stackra file contract:
 * Purpose: unit tests of `shiftDecimal`: a decimal times a positive or negative power of ten, exact.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0220 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { shiftDecimal } from "#core/functions/shift-decimal.function";

describe("shiftDecimal", () => {
  it("moves the point right and left", () => {
    expect(shiftDecimal("3.75", 2)).toBe("375");
    expect(shiftDecimal("3.75", 4)).toBe("37500");
    expect(shiftDecimal("3.75", -1)).toBe("0.375");
    expect(shiftDecimal("0.000123", 2)).toBe("0.0123");
    expect(shiftDecimal("-1.5", 0)).toBe("-1.5");
  });

  it("refuses a non-decimal", () => {
    expect(() => shiftDecimal("1e3", 1)).toThrow(RangeError);
  });
});
