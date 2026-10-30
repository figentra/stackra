/**
 * Stackra file contract:
 * Purpose: `dayPeriodsOf(locale)`, the locale's names of the morning and afternoon halves of a 12-hour day ("AM" and
 *          "PM", "ص" and "م"), as Intl writes them.
 * Boundary: pure; Intl only, with "AM" and "PM" where Intl has no period.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (wave D, owner approval 2026-10-30).
 */

/**
 * The two period names.
 * @example dayPeriodsOf("en-US"); // ["AM", "PM"]
 */
export function dayPeriodsOf(locale: string): readonly [string, string] {
  const format = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: true,
    timeZone: "UTC",
  });
  const period = (hour: number, fallback: string) =>
    format.formatToParts(Date.UTC(2000, 0, 1, hour)).find((part) => part.type === "dayPeriod")
      ?.value ?? fallback;
  return [period(9, "AM"), period(15, "PM")];
}
