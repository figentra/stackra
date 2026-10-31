/**
 * Stackra file contract:
 * Purpose: `eventsOnDayOf(events, day, timeZone)`, the events that touch one day in a time zone, all-day ones first,
 *          then by start.
 * Boundary: pure; an event touches a day when it starts before the day ends and ends after it starts.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { CalendarDate } from "@internationalized/date";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";

/**
 * The events of one day.
 * @param events - every event
 * @param day - the day
 * @param timeZone - an IANA time zone
 * @returns the events touching the day, all-day first, then by start
 */
export function eventsOnDayOf(
  events: readonly SchedulerEvent[],
  day: CalendarDate,
  timeZone: string,
): SchedulerEvent[] {
  const from = day.toDate(timeZone).getTime();
  const until = day.add({ days: 1 }).toDate(timeZone).getTime();
  return events
    .filter((event) => event.start.getTime() < until && event.end.getTime() > from)
    .toSorted(
      (a, b) =>
        Number(b.isAllDay ?? false) - Number(a.isAllDay ?? false) ||
        a.start.getTime() - b.start.getTime(),
    );
}
