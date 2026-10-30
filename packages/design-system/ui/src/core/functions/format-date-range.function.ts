/**
 * Stackra file contract:
 * Purpose: `formatDateRange(range, locale)`, a range of days written the locale's way ("1–30 Sep 2026", "١–٣٠ سبتمبر"
 *          in Arabic with the locale's digits), or "" while either end is open.
 * Boundary: pure; `Intl.DateTimeFormat#formatRange` in UTC, so the days never shift with the device's zone. The caller
 *           applies the customer's digits setting (`withDigits`). Hermes has no `formatRange`; there both days are
 *           written in full with a dash between, where it threw before.
 * Runtime: isomorphic
 * Governing contract: ADR 0318; ADR 0060; STA-1371.
 */
import type { DateRangeValue } from "#contracts/types/date-range-value.type";

/**
 * The range as text.
 * @param range - the days
 * @param locale - a BCP 47 tag
 * @returns the range in the locale, or "" without both ends
 */
export function formatDateRange(range: DateRangeValue, locale: string): string {
  if (!range.start || !range.end) return "";
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const [start, end] = [range.start.toDate("UTC"), range.end.toDate("UTC")];
  return typeof format.formatRange === "function"
    ? format.formatRange(start, end)
    : `${format.format(start)} – ${format.format(end)}`;
}
