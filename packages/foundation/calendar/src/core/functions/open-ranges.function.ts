/**
 * Stackra file contract:
 * Purpose: `openRanges`, the working hours of a calendar between two instants as merged millisecond ranges.
 * Boundary: internal; `openIntervals` is its public form and `addWorkingMinutes` walks it. Hours belong to the local
 *           day they start on; a span whose end is not after its start ends on the next day, so the day before the
 *           window is read too. Days that are not open (`isOpen`) contribute nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5: working hours).
 */
import { dateOfDay } from "#core/functions/date-of-day.function";
import { dayStatus } from "#core/functions/day-status.function";
import { isOpen } from "#core/functions/is-open.function";
import { isoWeekday } from "#core/functions/iso-weekday.function";
import { localDay } from "#core/functions/local-day.function";
import { mergeRanges } from "#core/functions/merge-ranges.function";
import { minuteOfDay } from "#core/functions/minute-of-day.function";
import { zonedMs } from "#core/functions/zoned-ms.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

/**
 * The open ranges of `calendar` within `[from, to)` in epoch milliseconds.
 *
 * @example
 * openRanges(calendar, Date.parse("2026-01-04T00:00:00Z"), Date.parse("2026-01-05T00:00:00Z"));
 * // [[1767506400000, 1767535200000]] for 09:00 to 17:00 in UTC+3
 */
export function openRanges(
  calendar: BusinessCalendar,
  from: number,
  to: number,
): [number, number][] {
  const { timeZone } = calendar;
  const ranges: [number, number][] = [];
  const last = localDay(to, timeZone);
  for (let day = localDay(from, timeZone) - 1; day <= last; day += 1) {
    const entry = calendar.workingWeek.find((week) => week.day === isoWeekday(day));
    if (entry === undefined || !isOpen(calendar, dayStatus(calendar, dateOfDay(day)))) continue;
    for (const hours of entry.hours) {
      const open = minuteOfDay(hours.start);
      const close = minuteOfDay(hours.end);
      const start = Math.max(zonedMs(day, open, timeZone), from);
      const end = Math.min(zonedMs(close <= open ? day + 1 : day, close, timeZone), to);
      if (start < end) ranges.push([start, end]);
    }
  }
  return mergeRanges(ranges);
}
