/**
 * Stackra file contract:
 * Purpose: `openIntervals`, the working hours of a `BusinessCalendar` between two instants: the open windows a slot
 *          search, an SLA clock or an opening-hours page reads.
 * Boundary: pure over the calendar data and the runtime's time-zone data. Holidays, rest days and (when the calendar
 *           says so) uncertain days are closed; touching spans are merged; the result is clipped to `[from, to)`.
 *           Throws a `RangeError` for an instant without an offset or `to` before `from`.
 * Runtime: isomorphic
 * Governing contract: ADR 0366 (decision 5).
 */
import { instantMs } from "#core/functions/instant-ms.function";
import { openRanges } from "#core/functions/open-ranges.function";
import type { BusinessCalendar } from "#core/types/business-calendar.type";
import type { Interval } from "#core/types/interval.type";

/**
 * The open intervals of `calendar` within `[from, to)`, oldest first, in UTC.
 *
 * @example
 * openIntervals(calendar, "2026-01-04T00:00:00Z", "2026-01-05T00:00:00Z");
 * // [{ start: "2026-01-04T06:00:00.000Z", end: "2026-01-04T14:00:00.000Z" }]
 */
export function openIntervals(calendar: BusinessCalendar, from: string, to: string): Interval[] {
  const start = instantMs(from);
  const end = instantMs(to);
  if (end < start) throw new RangeError(`The end ${to} is before the start ${from}`);
  return openRanges(calendar, start, end).map(([open, close]) => ({
    start: new Date(open).toISOString(),
    end: new Date(close).toISOString(),
  }));
}
