/**
 * Stackra file contract:
 * Purpose: `toRecord`, the matcher that checks a list of events holds one of a class with the given fields:
 *          `expect(app.events.published()).toRecord(StockLow, { variantId, available: 2 })`, and
 *          `expect(result).toRecord(OrderCancelled, { reason })` on what `run()` returns.
 * Boundary: the received value is a list of events (or of recorded events), or an object whose `events` is such a
 *           list: the shape a `run()` result of `@stackra/actions/testing` exposes for what the action recorded. The
 *           fields are compared structurally and only those given are checked. Registered with `expect` when this
 *           entry is imported.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { AnyClass } from "@stackra/container";
import { createMatcher } from "@stackra/testing";
import type { Fields } from "@stackra/validation";

import { Event } from "#core/index";
import { findEvent } from "#testing/functions/find-event.function";

/** The events of a list of events or recorded events. */
function eventsOf(received: readonly unknown[]): Event[] {
  return received.flatMap((item) => {
    if (item instanceof Event) return [item];
    const event = (item as { event?: unknown } | null)?.event;
    return event instanceof Event ? [event] : [];
  });
}

/** The list a received value carries: itself, or its `events`; undefined for anything else. */
function listOf(received: unknown): readonly unknown[] | undefined {
  if (Array.isArray(received)) return received;
  const events = (received as { events?: unknown } | null)?.events;
  return Array.isArray(events) ? events : undefined;
}

/**
 * Passes when `received`, or its `events`, holds an event of `type` with every field of `fields`.
 *
 * @throws TypeError when `received` is neither a list nor an object with an `events` list.
 */
export const toRecord = createMatcher(
  "toRecord",
  (
    received: readonly unknown[] | { readonly events: readonly unknown[] },
    type: AnyClass<Event>,
    fields: object = {},
  ) => {
    const list = listOf(received);
    if (list === undefined)
      throw new TypeError(
        "toRecord: expect a list of events, such as app.events.published(), or a run() result",
      );
    const events = eventsOf(list);
    const pass = findEvent(events, type, fields) !== undefined;
    return {
      pass,
      message: () =>
        `expected ${pass ? "not " : ""}to record ${type.name} with ${JSON.stringify(fields)}, ` +
        `recorded [${events.map((event) => event.constructor.name).join(", ")}]`,
    };
  },
);

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Asserts the list (or a `run()` result's `events`) holds an event of `type` with these fields. */
    toRecord<E extends Event>(type: AnyClass<E>, fields?: Partial<Fields<E>>): R;
  }
}
