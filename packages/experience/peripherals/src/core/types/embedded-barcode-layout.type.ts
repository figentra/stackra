/**
 * Stackra file contract:
 * Purpose: `EmbeddedBarcodeLayout`, one row of a market pack's in-store barcode table: which prefix it matches, how
 *          many digits are the item and how many the value, the value's decimals and unit, and whether a value check
 *          digit sits between them.
 * Boundary: a type only; market-pack data (GS1 member organisations assign prefixes 20 to 29 differently per country),
 *           never a literal in code. `parseEmbeddedBarcode` checks the digits add up to the code length.
 * Runtime: isomorphic
 * Governing contract: the COM-241 answer (barcode prefixes in `market-pack:*`); ADR 0339 (decision 7).
 */
import type { EmbeddedValue } from "#core/enums/embedded-value.enum";

/** How one prefix's codes are laid out. */
export interface EmbeddedBarcodeLayout {
  /** The leading digits it matches (`"21"`, `"2"` for UPC-A). */
  readonly prefix: string;

  /** The code's length with its check digit: 13 (EAN-13) or 12 (UPC-A). */
  readonly length: 12 | 13;

  /** Digits of the item code after the prefix. */
  readonly itemDigits: number;

  /** Digits of the value after the item code. */
  readonly valueDigits: number;

  /** Implied decimals of the value (3 for grams of a kilogram weight, 2 for cents). */
  readonly valueDecimals: number;

  /** What the value is. */
  readonly kind: EmbeddedValue;

  /** The value's unit: `kg` for a weight, an ISO 4217 code for a price. */
  readonly unit: string;

  /** True when a price or weight check digit sits between the item and the value. */
  readonly valueCheckDigit: boolean;
}
