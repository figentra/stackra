/**
 * Stackra file contract:
 * Purpose: `eventLanes(events)`, the side-by-side lane of each booking in one column: bookings whose busy time
 *          overlaps share the column's width; one that only overlaps a processing gap does not take a lane of its own.
 * Boundary: internal; pure. Bookings are placed in start order (then id), each in the first lane free of busy time;
 *           `lanes` is the width share of the cluster the booking is in.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3: processing gaps).
 */
import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";
import { busySpans } from "#core/functions/busy-spans.function";

/** Whether two span lists overlap. */
const overlaps = (
  left: readonly (readonly [number, number])[],
  right: readonly (readonly [number, number])[],
): boolean => left.some(([a, b]) => right.some(([c, d]) => a < d && c < b));

/**
 * Each booking's lane and the lane count of its cluster, by id.
 *
 * @example
 * eventLanes(column).get("bk_1"); // { lane: 0, lanes: 2 }
 */
export function eventLanes(
  events: readonly SchedulerEvent[],
): Map<string, { readonly lane: number; readonly lanes: number }> {
  const ordered = [...events].sort((a, b) => a.start - b.start || (a.id < b.id ? -1 : 1));
  const lanes: SchedulerEvent[][] = [];
  const laneOf = new Map<string, number>();
  for (const event of ordered) {
    const spans = busySpans(event);
    let lane = lanes.findIndex((members) =>
      members.every((other) => !overlaps(busySpans(other), spans)),
    );
    if (lane === -1) lane = lanes.push([]) - 1;
    lanes[lane]?.push(event);
    laneOf.set(event.id, lane);
  }
  const out = new Map<string, { readonly lane: number; readonly lanes: number }>();
  for (const event of ordered) {
    const spans = busySpans(event);
    const width =
      1 +
      Math.max(
        laneOf.get(event.id) ?? 0,
        ...ordered
          .filter((other) => other.id !== event.id && overlaps(busySpans(other), spans))
          .map((other) => laneOf.get(other.id) ?? 0),
      );
    out.set(event.id, { lane: laneOf.get(event.id) ?? 0, lanes: width });
  }
  return out;
}
