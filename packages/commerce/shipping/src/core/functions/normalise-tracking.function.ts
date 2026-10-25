/**
 * Stackra file contract:
 * Purpose: `normaliseTracking`, a carrier's raw events turned into one `TrackingTimeline`: each code mapped through the
 *          connector's `TrackingMap`, duplicates (the same code at the same instant, from a poll and a webhook) kept
 *          once, events ordered by instant, the current state taken from the latest, and unknown codes listed.
 * Boundary: pure; no clock. The latest instant wins, so a late webhook for an older event never moves the state back;
 *           two events at one instant keep their input order. A code missing from the map is reported in `unmapped`,
 *           never guessed. An `at` that is not a date is a `RangeError`: the connector must send ISO 8601.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 4).
 */
import type { CarrierEvent } from "#contracts/types/carrier-event.type";
import type { TrackingEvent } from "#contracts/types/tracking-event.type";
import type { TrackingMap } from "#contracts/types/tracking-map.type";
import type { TrackingTimeline } from "#contracts/types/tracking-timeline.type";

/**
 * The normalised history of `events` under `map`.
 *
 * @example
 * const timeline = normaliseTracking(await gateway.track(shipmentId), gateway.trackingMap);
 * timeline.state; // "out_for_delivery"
 * @throws RangeError when an event's `at` is not a parseable instant.
 */
export function normaliseTracking(
  events: readonly CarrierEvent[],
  map: TrackingMap,
): TrackingTimeline {
  const seen = new Set<string>();
  const unmapped: string[] = [];
  const mapped: { readonly event: TrackingEvent; readonly time: number }[] = [];
  for (const event of events) {
    const time = Date.parse(event.at);
    if (Number.isNaN(time))
      throw new RangeError(
        `normaliseTracking: event ${event.code} has no valid instant, got "${event.at}"`,
      );
    const state = Object.hasOwn(map, event.code) ? map[event.code] : undefined;
    if (state === undefined) {
      if (!unmapped.includes(event.code)) unmapped.push(event.code);
      continue;
    }
    const key = `${event.code}\u0000${time}`;
    if (seen.has(key)) continue;
    seen.add(key);
    mapped.push({ event: { ...event, state }, time });
  }
  // Array#sort is stable, so events at one instant keep their input order.
  mapped.sort((a, b) => a.time - b.time);
  const ordered = mapped.map((entry) => entry.event);
  return { state: ordered.at(-1)?.state ?? null, events: ordered, unmapped };
}
