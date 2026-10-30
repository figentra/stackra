/**
 * Stackra file contract:
 * Purpose: `hijriYearsOf(year, locale)`, the Hijri (Umm al-Qura) years a Gregorian year spans, written in `locale`
 *          ("1447–1448"), for a YearPicker in the Hijri option.
 * Boundary: pure; Intl only. Digits are the locale's; the caller applies the customer's with `withDigits`.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (Hijri option, owner approval 2026-10-28); ADR 0192 (decision 3).
 */
import { calendarLocaleOf } from "#core/functions/calendar-locale-of.function";

/**
 * The Hijri years a Gregorian year spans.
 * @param year - the Gregorian year
 * @param locale - a BCP 47 tag
 * @returns one year, or the first and last joined by an en dash
 */
export function hijriYearsOf(year: number, locale: string): string {
  const format = new Intl.DateTimeFormat(calendarLocaleOf(locale, "islamic-umalqura"), {
    year: "numeric",
    timeZone: "UTC",
  });
  const of = (month: number, day: number) =>
    format.formatToParts(Date.UTC(year, month, day)).find((part) => part.type === "year")?.value ??
    "";
  const [first, last] = [of(0, 1), of(11, 31)];
  return first === last ? first : `${first}–${last}`;
}
