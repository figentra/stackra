/**
 * Stackra file contract:
 * Purpose: `toGregorian(date)`, a date of any calendar as a Gregorian `CalendarDate` (or `CalendarDateTime`), so a
 *          picker shown in the Hijri calendar still hands out Gregorian values.
 * Boundary: pure; `null` and `undefined` pass through.
 * Runtime: isomorphic
 * Governing contract: wave 3a forms and pickers (Hijri option, owner approval 2026-10-28); ADR 0192 (decision 3).
 */
import {
  GregorianCalendar,
  toCalendar,
  type CalendarDate,
  type CalendarDateTime,
} from "@internationalized/date";

/**
 * The same day in the Gregorian calendar.
 * @param date - a date in any calendar
 * @returns the Gregorian date
 */
export function toGregorian<T extends CalendarDate | CalendarDateTime | null | undefined>(
  date: T,
): T {
  if (!date || date.calendar.identifier === "gregory") return date;
  return toCalendar(date, new GregorianCalendar()) as T;
}
