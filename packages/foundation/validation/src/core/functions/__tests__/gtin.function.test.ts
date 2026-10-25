/**
 * Stackra file contract:
 * Purpose: unit tests of `gtinCheckDigit`, `isGtin` and `gtin()`: GTIN-8, UPC-A, EAN-13 and GTIN-14 check digits,
 *          refusals, and the GTIN-14 output of the schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; conflict #1; COM-78.
 */
import { describe, expect, it } from "@stackra/testing";

import { gtin } from "#core/functions/gtin.function";
import { gtinCheckDigit } from "#core/functions/gtin-check-digit.function";
import { isGtin } from "#core/functions/is-gtin.function";

describe("GTIN", () => {
  it("computes check digits", () => {
    expect(gtinCheckDigit("400638133393")).toBe(1);
    expect(gtinCheckDigit("03600029145")).toBe(2);
    expect(gtinCheckDigit("9638507")).toBe(4);
    expect(() => gtinCheckDigit("12")).toThrow(RangeError);
  });

  it.each(["96385074", "036000291452", "4006381333931", "14006381333938"])(
    "accepts %s",
    (value) => {
      expect(isGtin(value)).toBe(true);
    },
  );

  it.each(["4006381333932", "400638133393", "40063813339a1", ""])("refuses %j", (value) => {
    expect(isGtin(value)).toBe(false);
  });

  it("reads a GTIN as GTIN-14", () => {
    expect(gtin().parse(" 4006381333931 ")).toBe("04006381333931");
    expect(gtin().safeParse("4006381333932").success).toBe(false);
  });
});
