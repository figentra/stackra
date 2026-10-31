/**
 * Stackra file contract:
 * Purpose: `dayLayoutOf(events, day, options)`, the timed events of one day placed in its column: top and height as
 *          shares of the hours shown, and side-by-side lanes for events that overlap (each group of overlapping events
 *          shares the width; an event takes the first lane free at its start).
 * Boundary: pure; all-day events and events outside the hours are left out; an event running past the hours is cut
 *           at their edge.
 * Runtime: isomorphic
 * Governing contract: STA-1371 (gap build, owner approval 2026-10-31).
 */
import type { CalendarDate } from "@internationalized/date";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import type { PlacedEvent } from "#core/types/placed-event.type";

/** A minute in milliseconds. */
const MINUTE = 60_000;

/**
 * The placed events of one day.
 * @param events - every event
 * @param day - the day of the column
 * @param options - the time zone and the hours the column shows
 * @returns the day's timed events, placed
 */
export function dayLayoutOf(
  events: readonly SchedulerEvent[],
  day: CalendarDate,
  options: { readonly timeZone: string; readonly startHour: number; readonly endHour: number },
): PlacedEvent[] {
  // shortcut: minutes count from local midnight, so a daylight-saving day is off by its shift; read wall clocks if a market needs it.
  const midnight = day.toDate(options.timeZone).getTime();
  const from = options.startHour * 60;
  const until = options.endHour * 60;
  const span = until - from;
  const clamp = (at: Date) => Math.min(until, Math.max(from, (at.getTime() - midnight) / MINUTE));
  const timed = events
    .filter((event) => !event.isAllDay)
    .map((event) => ({ event, start: clamp(event.start), end: clamp(event.end) }))
    .filter(({ start, end }) => end > start)
    .toSorted((a, b) => a.start - b.start || b.end - a.end);

  const placed: PlacedEvent[] = [];
  let group: { item: (typeof timed)[number]; lane: number }[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;
  const close = () => {
    for (const { item, lane } of group) {
      placed.push({
        event: item.event,
        top: (item.start - from) / span,
        height: (item.end - item.start) / span,
        lane,
        lanes: laneEnds.length,
      });
    }
    group = [];
    laneEnds = [];
  };
  for (const item of timed) {
    if (item.start >= groupEnd) close();
    groupEnd = Math.max(group.length === 0 ? -Infinity : groupEnd, item.end);
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) lane = laneEnds.push(item.end) - 1;
    else laneEnds[lane] = item.end;
    group.push({ item, lane });
  }
  close();
  return placed;
}
