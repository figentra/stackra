/**
 * Stackra file contract:
 * Purpose: `publishedEvents`, the snapshot behind `app.events.published()` and `toEmit`: the events a harness's bus
 *          dispatched in process, then those written to its outbox fake, each occurrence once.
 * Boundary: reads the harness only. Internal: not exported from the entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { AnyClass } from "@stackra/container";

import { Event } from "#core/index";
import { OutboxFake } from "#testing/outbox.fake";
import type { EventsHarness } from "#testing/types/events-harness.type";
import type { PublishedEvents } from "#testing/types/published-events.type";

/**
 * The events `harness` published so far.
 *
 * @example
 * publishedEvents(currentHarness()).ofType(OrderPaid);
 */
export function publishedEvents(harness: EventsHarness): PublishedEvents {
  const written = harness.outbox instanceof OutboxFake ? harness.outbox.written() : [];
  const seen = new Set<string>();
  const events: Event[] = [];
  for (const { event, meta } of [...harness.bus.published(), ...written])
    if (!seen.has(meta.id) && event instanceof Event) {
      seen.add(meta.id);
      events.push(event);
    }
  Object.defineProperty(events, "ofType", {
    value: <E extends Event>(type: AnyClass<E>): readonly E[] =>
      Object.freeze(events.filter((event): event is E => event instanceof type)),
  });
  return Object.freeze(events) as unknown as PublishedEvents;
}
