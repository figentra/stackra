/**
 * Stackra file contract:
 * Purpose: `moveEvent(event, minutes, bounds, to?)`, a booking moved by a number of minutes, snapped to the step and
 *          kept inside the visible hours with its length, and optionally onto another day and resource.
 * Boundary: internal; pure. The caller decides whether the moved booking may be saved.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import type { SchedulerBounds } from "#core/types/scheduler-bounds.type";

/**
 * `event` moved by `minutes`, snapped to the slot grid and kept inside `bounds`, optionally to another day or
 * resource.
 *
 * @example
 * moveEvent(booking, 17, { startMinute: 540, endMinute: 1080, slotMinutes: 15 }); // 15 minutes later
 */
export function moveEvent(
  event: SchedulerEvent,
  minutes: number,
  bounds: SchedulerBounds,
  to?: { readonly day: string; readonly resource: string },
): SchedulerEvent {
  const length = event.end - event.start;
  const step = bounds.slotMinutes;
  const snapped = Math.round((event.start + minutes - bounds.startMinute) / step) * step;
  const start = Math.min(
    Math.max(bounds.startMinute + snapped, bounds.startMinute),
    bounds.endMinute - length,
  );
  return { ...event, ...to, start, end: start + length };
}
