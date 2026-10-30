/**
 * Stackra file contract:
 * Purpose: proves `currencyFractionDigitsOf` for two-, three- and zero-digit currencies and refuses an unknown code.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: gap inventory row 2; ADR 0022 (test placement).
 */
import { currencyFractionDigitsOf } from "#core/functions/currency-fraction-digits-of.function";

describe("currencyFractionDigitsOf", () => {
  it.each([
    ["SAR", 2],
    ["USD", 2],
    ["KWD", 3],
    ["BHD", 3],
    ["JPY", 0],
  ])("gives %s %i minor-unit digits", (currency, digits) => {
    expect(currencyFractionDigitsOf(currency)).toBe(digits);
  });

  it("refuses a code that is not a currency", () => {
    expect(() => currencyFractionDigitsOf("NOPE")).toThrow(RangeError);
  });
});
