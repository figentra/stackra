/**
 * Stackra file contract:
 * Purpose: `isDateFormat`, whether a cell's number format shows a date or time, so the XLSX reader yields the serial
 *          number as ISO 8601: the built-in date ids and any custom code with a day, month, year, hour or second part.
 * Boundary: pure; internal to the XLSX reader.
 * Runtime: node
 * Governing contract: ADR 0367 (decision 2); ECMA-376 part 1, 18.8.30 (the built-in number formats).
 */

/** The built-in number format ids that show a date or a time (27 to 36 and 50 to 58 are the East Asian ones). */
const BUILT_IN_DATES = new Set(
  [
    [14, 22],
    [27, 36],
    [45, 47],
    [50, 58],
  ].flatMap(([from = 0, to = 0]) =>
    Array.from({ length: to - from + 1 }, (_, index) => from + index),
  ),
);

/**
 * Whether the format `id` (with its custom `code`, if any) shows a date or time.
 *
 * @example
 * isDateFormat(164, "yyyy-mm-dd"); // true
 * isDateFormat(2, undefined); // false ("0.00")
 */
export function isDateFormat(id: number, code: string | undefined): boolean {
  if (code === undefined) return BUILT_IN_DATES.has(id);
  // Quoted text, bracketed colours and conditions, and escaped characters are not parts of the date.
  const parts = code.replaceAll(/"[^"]*"|\[[^\]]*\]|\\./g, "");
  return /[dmyhs]/i.test(parts);
}
