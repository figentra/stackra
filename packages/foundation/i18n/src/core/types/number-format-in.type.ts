/**
 * Stackra file contract:
 * Purpose: `NumberFormatIn`, what `numberFormatIn` returns: the part of `Intl.NumberFormat` a formatter is called
 *          through, writing the configured digits.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28).
 */

/** A number formatter writing one numbering system. */
export interface NumberFormatIn {
  /** `value` formatted and written in the numerals. */
  format: (value: number | bigint) => string;
}
