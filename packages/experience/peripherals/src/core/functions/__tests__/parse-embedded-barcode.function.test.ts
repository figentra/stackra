/**
 * Stackra file contract:
 * Purpose: unit tests of `parseEmbeddedBarcode`: weight and price layouts read the item and the value, the longest
 *          prefix wins, a value check digit is skipped, an ordinary or misread code is null, and a layout that does
 *          not add up is refused.
 * Boundary: test only; the layouts are test data standing in for market-pack rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; the COM-241 answer.
 */
import { describe, expect, it } from "@stackra/testing";

import { EmbeddedValue } from "#core/enums/embedded-value.enum";
import { gs1CheckDigit } from "#core/functions/gs1-check-digit.function";
import { parseEmbeddedBarcode } from "#core/functions/parse-embedded-barcode.function";
import type { EmbeddedBarcodeLayout } from "#core/types/embedded-barcode-layout.type";

/** `body` with its GS1 check digit. */
const withCheck = (body: string) => `${body}${gs1CheckDigit(body)}`;

const weight: EmbeddedBarcodeLayout = {
  prefix: "21",
  length: 13,
  itemDigits: 5,
  valueDigits: 5,
  valueDecimals: 3,
  kind: EmbeddedValue.Weight,
  unit: "kg",
  valueCheckDigit: false,
};
const price: EmbeddedBarcodeLayout = {
  prefix: "2",
  length: 13,
  itemDigits: 6,
  valueDigits: 4,
  valueDecimals: 2,
  kind: EmbeddedValue.Price,
  unit: "SAR",
  valueCheckDigit: true,
};

describe("parseEmbeddedBarcode", () => {
  it("reads a weight barcode", () => {
    expect(parseEmbeddedBarcode("2112345012506", [weight])).toEqual({
      code: "2112345012506",
      prefix: "21",
      itemCode: "12345",
      kind: "weight",
      value: "1.250",
      unit: "kg",
    });
  });

  it("prefers the longest prefix and skips a value check digit", () => {
    const code = withCheck("251234571299");
    expect(parseEmbeddedBarcode(code, [price])).toMatchObject({
      prefix: "2",
      itemCode: "512345",
      value: "12.99",
      unit: "SAR",
    });
    expect(parseEmbeddedBarcode("2112345012506", [price, weight])?.prefix).toBe("21");
  });

  it("answers null for an ordinary code, a misread or a wrong length", () => {
    expect(parseEmbeddedBarcode("4006381333931", [weight])).toBeNull();
    expect(parseEmbeddedBarcode("2112345012505", [weight])).toBeNull();
    expect(parseEmbeddedBarcode("211234501250", [weight])).toBeNull();
    expect(parseEmbeddedBarcode("21123450125x6", [weight])).toBeNull();
  });

  it("refuses a layout that does not add up", () => {
    expect(() => parseEmbeddedBarcode("2112345012506", [{ ...weight, itemDigits: 4 }])).toThrow(
      RangeError,
    );
  });
});
