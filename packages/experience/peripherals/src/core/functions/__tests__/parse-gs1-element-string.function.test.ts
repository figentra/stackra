/**
 * Stackra file contract:
 * Purpose: unit tests of `parseGs1ElementString`: the raw form a scanner sends (with and without an AIM symbology
 *          identifier, GS separators after variable values) and the bracketed form read into elements, GTIN, weight
 *          and price; a wrong check digit, an unknown identifier, a bad length, a letter in a numeric value, a
 *          repeated identifier or a non-GS1 symbology answers null.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); the GS1 General Specifications; STA-965.
 */
import { describe, expect, it } from "@stackra/testing";

import { parseGs1ElementString } from "#core/functions/parse-gs1-element-string.function";

const GS = "\u001d";
const GTIN = "09501101530003";

describe("parseGs1ElementString", () => {
  it("reads a weighed pack's DataBar code: GTIN, net kilograms, expiry", () => {
    const code = `]e001${GTIN}3103001250${"17"}261130`;
    expect(parseGs1ElementString(code)).toEqual({
      code,
      elements: { "01": GTIN, "3103": "001250", "17": "261130" },
      gtin: GTIN,
      weight: { value: "1.250", unit: "kg" },
      price: null,
    });
  });

  it("ends a variable value at a GS and reads a local-currency price", () => {
    const parsed = parseGs1ElementString(`]C101${GTIN}10LOT-7${GS}3922899`);
    expect(parsed?.elements).toEqual({ "01": GTIN, "10": "LOT-7", "3922": "899" });
    expect(parsed?.price).toEqual({ value: "8.99", currency: null });
    expect(parsed?.weight).toBeNull();
  });

  it("reads the bracketed form, pounds, and a price with its ISO 4217 currency", () => {
    const parsed = parseGs1ElementString(`(01)${GTIN}(3202)000275(3932)978001299`);
    expect(parsed?.weight).toEqual({ value: "2.75", unit: "lb" });
    expect(parsed?.price).toEqual({ value: "12.99", currency: "978" });
  });

  it("skips a separator after a fixed-length value", () => {
    expect(parseGs1ElementString(`01${GTIN}${GS}3100000750`)?.weight).toEqual({
      value: "750",
      unit: "kg",
    });
  });

  it("answers null for what it cannot read", () => {
    for (const code of [
      "",
      `01${GTIN.slice(0, -1)}4`, // wrong check digit
      `01${GTIN}9912`, // an identifier not in the table
      `01${GTIN}310300125`, // a fixed value one digit short
      `01${GTIN}3922${"1".repeat(16)}`, // a variable value over its maximum
      `01${GTIN}30A1`, // a letter in a numeric value
      `01${GTIN}${GS}01${GTIN}`, // the same identifier twice
      `x(01)${GTIN}`, // text outside the bracketed pattern
      `(01)${GTIN}x(3103)001250`, // a bracketed value of the wrong length
      `(310)001250`, // a bracketed identifier of the wrong length
      `01${GTIN}3932978`, // a 393n with no amount
      "]E02112345012506", // an EAN-13 (parseEmbeddedBarcode's), by its symbology identifier
    ])
      expect(parseGs1ElementString(code)).toBeNull();
  });
});
