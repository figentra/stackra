/**
 * Stackra file contract:
 * Purpose: `addWorkingMinutes`, the instant a number of working minutes after an event: "respond within 4 working
 *          hours", an SLA escalation, a deadline in hours.
 * Boundary: pure over the calendar data. Only open hours count (`openIntervals`). Zero minutes gives the first open
 *           instant at or after `from`. Throws a `RangeError` for negative minutes, and when a whole year passes with
 *           no open hour, so a calendar with no working time never loops.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decisions 4 and 5).
 */
import { MS_PER_DAY } from "#core/constants/ms-per-day.constant";
import { instantMs } from "#core/functions/instant-ms.function";
import { openRanges } from "#core/functions/open-ranges.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";

/** How far one read of the working hours reaches. */
const WINDOW = 7 * MS_PER_DAY;

/** Consecutive empty windows (a year) after which the calendar is taken to have no working time. */
const EMPTY_LIMIT = 53;

/**
 * The instant, ISO 8601 in UTC, `minutes` working minutes after `from`.
 *
 * @example
 * addWorkingMinutes(calendar, "2026-01-04T13:00:00Z", 120); // next working day 07:00Z for 09:00-17:00 in UTC+3
 */
export function addWorkingMinutes(
  calendar: BusinessCalendar,
  from: string,
  minutes: number,
): string {
  if (!Number.isFinite(minutes) || minutes < 0)
    throw new RangeError(`Working minutes must be zero or more: ${minutes}`);
  let left = minutes * 60_000;
  let cursor = instantMs(from);
  for (let empty = 0; empty < EMPTY_LIMIT; cursor += WINDOW) {
    const ranges = openRanges(calendar, cursor, cursor + WINDOW);
    empty = ranges.length === 0 ? empty + 1 : 0;
    for (const [start, end] of ranges) {
      if (left <= end - start) return new Date(start + left).toISOString();
      left -= end - start;
    }
  }
  throw new RangeError("The calendar has no working time within a year");
}
