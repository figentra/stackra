/**
 * Stackra file contract:
 * Purpose: `resizeEvent(event, minutes, bounds)`, a booking whose end moves by a number of minutes, snapped to the
 *          step, never shorter than one step and never past the visible hours.
 * Boundary: internal; pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import type { SchedulerBounds } from "#core/types/scheduler-bounds.type";

/**
 * `event` with its end moved.
 *
 * @example
 * resizeEvent(booking, 30, bounds); // half an hour longer
 */
export function resizeEvent(
  event: SchedulerEvent,
  minutes: number,
  bounds: SchedulerBounds,
): SchedulerEvent {
  const step = bounds.slotMinutes;
  const snapped = Math.round((event.end + minutes - bounds.startMinute) / step) * step;
  const end = Math.max(
    Math.min(bounds.startMinute + snapped, bounds.endMinute),
    event.start + step,
  );
  return { ...event, end };
}
