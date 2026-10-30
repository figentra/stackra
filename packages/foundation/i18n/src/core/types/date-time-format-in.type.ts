/**
 * Stackra file contract:
 * Purpose: `DateTimeFormatIn`, what `dateTimeFormatIn` returns: the part of `Intl.DateTimeFormat` a formatter is
 *          called through, writing the configured digits.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28).
 */

/** A date and time formatter writing one numbering system. */
export interface DateTimeFormatIn {
  /** `value` (now when omitted) formatted and written in the numerals. */
  format: (value?: Date | number) => string;
}
