/**
 * Stackra file contract:
 * Purpose: `dayStatus`, what one date is under a `BusinessCalendar`: working, a rest day, a holiday, or uncertain.
 * Boundary: pure over the calendar data. A confirmed holiday wins over a rest day; a rest day wins over an uncertain
 *           holiday (it is closed either way). Throws a `RangeError` for a malformed date.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 3 and 4).
 */
import { DayStatus } from "#core/enums/day-status.enum";
import { dayNumber } from "#core/functions/day-number.function";
import { holidayCover } from "#core/functions/holiday-cover.function";
import { isoWeekday } from "#core/functions/iso-weekday.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * The status of `date` under `calendar`.
 *
 * @example
 * dayStatus(calendar, "2026-01-04"); // "working"
 */
export function dayStatus(calendar: BusinessCalendar, date: IsoDate): DayStatus {
  const day = dayNumber(date);
  let uncertain = false;
  for (const rule of calendar.holidays) {
    const cover = holidayCover(rule, day, calendar.holidays);
    if (cover === DayStatus.Holiday) return DayStatus.Holiday;
    if (cover === DayStatus.Uncertain) uncertain = true;
  }
  if (!calendar.workingWeek.some((entry) => entry.day === isoWeekday(day)))
    return DayStatus.RestDay;
  return uncertain ? DayStatus.Uncertain : DayStatus.Working;
}
