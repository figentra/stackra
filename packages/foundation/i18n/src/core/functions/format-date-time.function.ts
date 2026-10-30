/**
 * Stackra file contract:
 * Purpose: `formatDateTime(value, tag, options, numerals)`, a date or time formatted in `tag` and written in
 *          `numerals` (by default the tag's own `-u-nu-` keyword), on every engine.
 * Boundary: pure apart from Intl; `dateTimeFormatIn` does the work. An ISO string or epoch milliseconds is read as a
 *           `Date`; an invalid date throws instead of printing "Invalid Date".
 * Runtime: isomorphic
 * Governing contract: ADR 0192 (decision 2, as amended 2026-10-28; decision 3).
 */
import type { NumberingSystem } from "#core/enums/numbering-system.enum";
import { dateTimeFormatIn } from "#core/functions/date-time-format-in.function";
import { numeralsOf } from "#core/functions/numerals-of.function";

/**
 * `value` formatted in `tag`, in `numerals`.
 *
 * @throws RangeError when `value` is not a valid date.
 * @example
 * formatDateTime("2026-10-28T00:00:00Z", "en-u-nu-arab", { dateStyle: "medium", timeZone: "UTC" }); // "Oct ٢٨, ٢٠٢٦"
 */
export function formatDateTime(
  value: Date | string | number,
  tag: string,
  options?: Intl.DateTimeFormatOptions,
  numerals: NumberingSystem = numeralsOf(tag),
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new RangeError(`formatDateTime: ${String(value)} is not a valid date`);
  return dateTimeFormatIn(tag, options, numerals).format(date);
}
