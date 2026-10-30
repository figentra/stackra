/**
 * Stackra file contract:
 * Purpose: `updatedAgoOf`, how long ago `at` was, written in the locale at the largest whole unit: "now", "2 min.
 *          ago", "3 hr. ago", "yesterday" (Arabic "قبل دقيقتين").
 * Boundary: pure; `now` is passed in so the caller decides when it ticks. Hermes has no Intl.RelativeTimeFormat;
 *           there it writes the time of day within a day and the date beyond, which threw before.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (decisions 14 to 18); ADR 0192 (digits); STA-1371.
 */

/** Each unit and its length in seconds, largest first. */
const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

/**
 * `at` relative to `now`.
 * @example updatedAgoOf(Date.now() - 120_000, Date.now(), "en"); // "2 min. ago"
 */
export function updatedAgoOf(at: Date | number, now: number, locale: string): string {
  const seconds = Math.round((now - new Date(at).getTime()) / 1000);
  if (typeof Intl.RelativeTimeFormat !== "function")
    return new Intl.DateTimeFormat(
      locale,
      Math.abs(seconds) < 86_400 ? { timeStyle: "short" } : { dateStyle: "medium" },
    ).format(new Date(at));
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  for (const [unit, length] of UNITS)
    if (Math.abs(seconds) >= length) return format.format(-Math.trunc(seconds / length), unit);
  return format.format(0, "second");
}
