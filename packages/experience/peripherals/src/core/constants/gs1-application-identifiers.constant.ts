/**
 * Stackra file contract:
 * Purpose: `GS1_APPLICATION_IDENTIFIERS`, the GS1 application identifiers a till reads from a GS1-128 or GS1 DataBar
 *          code, keyed by their first two or three digits: how many digits the identifier has, how long its value is,
 *          whether that length is fixed (no separator follows it) and whether the value may hold letters.
 * Boundary: internal data, read by `parseGs1ElementString`. A standard's table (the GS1 General Specifications, section
 *           3), not a business value: markets do not change it. Only the identifiers a point of sale needs are here
 *           (identity, batch, dates, serial, count, measures, prices, origin); an identifier missing from it makes the
 *           code unreadable (`null`), never guessed. A two-digit key never prefixes a three-digit one.
 * Runtime: isomorphic
 * Governing contract: the GS1 General Specifications (application identifiers); ADR 0339 (decision 7); STA-965.
 */

/** How one application identifier and its value are laid out. */
interface Gs1Identifier {
  /** Digits of the identifier itself (`01` has 2, `3103` has 4). */
  readonly digits: 2 | 3 | 4;
  /** The value's length when `isFixed`, otherwise its maximum. */
  readonly length: number;
  /** True for a predefined length: no separator follows the value. */
  readonly isFixed: boolean;
  /** True when the value may hold letters (a batch, a serial); otherwise digits only. */
  readonly isText: boolean;
}

const fixed = (digits: 2 | 3 | 4, length: number): Gs1Identifier => ({
  digits,
  length,
  isFixed: true,
  isText: false,
});
const numeric = (digits: 2 | 3 | 4, length: number): Gs1Identifier => ({
  digits,
  length,
  isFixed: false,
  isText: false,
});
const text = (digits: 2 | 3 | 4, length: number): Gs1Identifier => ({
  digits,
  length,
  isFixed: false,
  isText: true,
});

/** The identifiers read, by their two- or three-digit key. */
export const GS1_APPLICATION_IDENTIFIERS: Readonly<Record<string, Gs1Identifier>> = Object.freeze({
  /** SSCC, the logistic unit. */
  "00": fixed(2, 18),
  /** GTIN of the trade item. */
  "01": fixed(2, 14),
  /** GTIN of the contained items. */
  "02": fixed(2, 14),
  /** Batch or lot. */
  "10": text(2, 20),
  /** Production date (YYMMDD). */
  "11": fixed(2, 6),
  /** Due date (YYMMDD). */
  "12": fixed(2, 6),
  /** Packaging date (YYMMDD). */
  "13": fixed(2, 6),
  /** Best before date (YYMMDD). */
  "15": fixed(2, 6),
  /** Sell by date (YYMMDD). */
  "16": fixed(2, 6),
  /** Expiration date (YYMMDD). */
  "17": fixed(2, 6),
  /** Internal product variant. */
  "20": fixed(2, 2),
  /** Serial number. */
  "21": text(2, 20),
  /** Consumer product variant. */
  "22": text(2, 20),
  /** Variable count of items. */
  "30": numeric(2, 8),
  /** Trade measures, metric and imperial (310n net kilograms, 320n net pounds; n is the implied decimals). */
  "31": fixed(4, 6),
  "32": fixed(4, 6),
  "33": fixed(4, 6),
  "34": fixed(4, 6),
  "35": fixed(4, 6),
  "36": fixed(4, 6),
  /** Count of trade items in a logistic unit. */
  "37": numeric(2, 8),
  /** Global location numbers (ship to, bill to, ...). */
  "41": fixed(3, 13),
  /** Additional product identification. */
  "240": text(3, 30),
  /** Customer part number. */
  "241": text(3, 30),
  /** Secondary serial number. */
  "250": text(3, 30),
  /** Reference to source entity. */
  "251": text(3, 30),
  /** Amount payable, local currency (392n; n is the implied decimals). */
  "392": numeric(4, 15),
  /** Amount payable with the ISO 4217 numeric currency first (393n). */
  "393": numeric(4, 18),
  /** Customer purchase order number. */
  "400": text(3, 30),
  /** Country of origin (ISO 3166 numeric). */
  "422": numeric(3, 3),
});
