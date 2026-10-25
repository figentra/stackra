/**
 * Stackra file contract:
 * Purpose: `addBusinessDays`, the date a number of business days after (or, negative, before) a date, with every
 *          uncertain day the count crossed: the generic arithmetic under delivery promises, payment terms and legal
 *          deadlines.
 * Boundary: pure over the calendar data. Counting starts the day after `date`; zero returns `date` unchanged. Uncertain
 *           days count as the calendar's `uncertainDays` says and are always reported. Legal counting rules (trigger
 *           day, roll-forward, extensions) are the caller's rules, not this function's.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 3 and 4).
 */
import { DayStatus } from "#core/enums/day-status.enum";
import { dateOfDay } from "#core/functions/date-of-day.function";
import { dayNumber } from "#core/functions/day-number.function";
import { dayStatus } from "#core/functions/day-status.function";
import { isOpen } from "#core/functions/is-open.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";
import type { BusinessDayResult } from "#core/types/business-day-result.type";
import type { IsoDate } from "#core/types/iso-date.type";

/**
 * `days` business days from `date` under `calendar`.
 *
 * @example
 * addBusinessDays(calendar, "2026-01-08", 1); // { date: "2026-01-11", uncertain: [] } over a Fri-Sat weekend
 */
export function addBusinessDays(
  calendar: BusinessCalendar,
  date: IsoDate,
  days: number,
): BusinessDayResult {
  if (!Number.isInteger(days))
    throw new RangeError(`Business days must be a whole number: ${days}`);
  const step = Math.sign(days);
  const uncertain: IsoDate[] = [];
  let day = dayNumber(date);
  for (let left = Math.abs(days); left > 0;) {
    day += step;
    const current = dateOfDay(day);
    const status = dayStatus(calendar, current);
    if (status === DayStatus.Uncertain) uncertain.push(current);
    if (isOpen(calendar, status)) left -= 1;
  }
  return { date: dateOfDay(day), uncertain: step < 0 ? uncertain.reverse() : uncertain };
}
