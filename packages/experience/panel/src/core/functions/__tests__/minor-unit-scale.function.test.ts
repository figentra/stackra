/**
 * Stackra file contract:
 * Purpose: unit tests of `minorUnitScale`: two, zero and three fraction digits, and an unknown code refused.
 * Boundary: unit tier; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { minorUnitScale } from "#core/functions/minor-unit-scale.function";

describe("minorUnitScale", () => {
  it("follows the currency's fraction digits", () => {
    expect(minorUnitScale("SAR")).toBe(100);
    expect(minorUnitScale("JPY")).toBe(1);
    expect(minorUnitScale("KWD")).toBe(1000);
  });

  it("refuses a code that is not a currency", () => {
    expect(() => minorUnitScale("not-a-currency")).toThrow(RangeError);
  });
});
