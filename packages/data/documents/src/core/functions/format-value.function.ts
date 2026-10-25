/**
 * Stackra file contract:
 * Purpose: `formatValue`, the text of one render-data value in a locale: numbers and dates through `Intl`, strings as
 *          they are.
 * Boundary: internal to this package; not exported from the entry. The locale code carries any numbering system the
 *           market pack chose (`ar-SA-u-nu-latn`), so no digit style is decided here. Answers `undefined` for a value
 *           that has no text (an object, an array, a function), which the caller refuses.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 2).
 */

/** The text of `value` in `locale`, or `undefined` when it has none. */
export function formatValue(value: unknown, locale: string): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint")
    return new Intl.NumberFormat(locale).format(value);
  if (typeof value === "boolean") return String(value);
  if (value instanceof Date) return new Intl.DateTimeFormat(locale).format(value);
  return undefined;
}
