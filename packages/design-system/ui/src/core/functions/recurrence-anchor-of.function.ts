/**
 * Stackra file contract:
 * Purpose: `recurrenceAnchorOf(start, calendar)`, the defaults a rule takes from its first day: the weekday, and the
 *          day of the month, nth weekday and month counted in `calendar` (so a Hijri rule starting 2026-02-18 is on the
 *          1st of Ramadan).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: RFC 5545 section 3.3.10; RFC 7529; STA-1371.
 */
import {
  GregorianCalendar,
  IslamicUmalquraCalendar,
  toCalendar,
  type CalendarDate,
} from "@internationalized/date";

import type { CalendarSystem } from "#contracts/enums/calendar-system.enum";
import { RECURRENCE_WEEKDAYS } from "#core/constants/recurrence-weekdays.constant";
import type { RecurrenceAnchor } from "#core/types/recurrence-anchor.type";

/**
 * The first day's defaults.
 * @param start - the first day, in any calendar
 * @param calendar - the calendar months count in
 * @returns the weekday, day of month, nth weekday and month
 */
export function recurrenceAnchorOf(
  start: CalendarDate,
  calendar: CalendarSystem = "gregory",
): RecurrenceAnchor {
  const day = toCalendar(
    start,
    calendar === "islamic-umalqura" ? new IslamicUmalquraCalendar() : new GregorianCalendar(),
  );
  // getUTCDay counts from Sunday; RECURRENCE_WEEKDAYS from Monday.
  const weekday = RECURRENCE_WEEKDAYS[(day.toDate("UTC").getUTCDay() + 6) % 7] ?? "MO";
  const isLast = day.day + 7 > day.calendar.getDaysInMonth(day);
  return {
    weekday,
    monthDay: day.day,
    nth: isLast ? -1 : Math.ceil(day.day / 7),
    month: day.month,
  };
}
