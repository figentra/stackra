/**
 * Stackra file contract:
 * Purpose: `busySpans(event)`, the minutes a booking holds its resource: its busy segments, or the whole booking when
 *          it has none; processing gaps leave the resource free.
 * Boundary: internal; pure. Spans are `[start, end)` in minutes from midnight.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3).
 */
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";

/**
 * The busy spans of `event`.
 *
 * @example
 * busySpans({ start: 600, end: 690, segments: [{ offset: 0, duration: 30, kind: "busy" }, ...] });
 */
export function busySpans(event: SchedulerEvent): readonly (readonly [number, number])[] {
  if (event.segments === undefined || event.segments.length === 0)
    return [[event.start, event.end]];
  return event.segments
    .filter((segment) => segment.kind === "busy")
    .map(
      (segment) =>
        [event.start + segment.offset, event.start + segment.offset + segment.duration] as const,
    );
}
