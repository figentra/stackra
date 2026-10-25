/**
 * Stackra file contract:
 * Purpose: `toEmit`, the matcher that checks code under test published an event of a class with the given fields:
 *          `expect(accounts).toEmit(PointsEarned, { points: 100 })` reads what the testing app compiled last
 *          published, and `expect(list).toEmit(...)` reads a list of events.
 * Boundary: a received list (such as `app.events.published()`) is searched as given; any other value names the
 *           subject for the message only, and the current app's published events are searched. Registered with
 *           `expect` when this entry is imported.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { AnyClass } from "@stackra/container";
import { createMatcher } from "@stackra/testing";
import type { Fields } from "@stackra/validation";

import { Event } from "#core/index";
import { currentHarness } from "#testing/functions/current-harness.function";
import { findEvent } from "#testing/functions/find-event.function";
import { publishedEvents } from "#testing/functions/published-events.function";

/**
 * Passes when the received list, or else the current app's published events, holds an event of `type` with every
 * field of `fields`.
 *
 * @throws Error when the received value is not a list and no testing app has been compiled.
 */
export const toEmit = createMatcher(
  "toEmit",
  (received: unknown, type: AnyClass<Event>, fields: object = {}) => {
    const events: readonly Event[] = Array.isArray(received)
      ? received.filter((item): item is Event => item instanceof Event)
      : publishedEvents(currentHarness());
    const pass = findEvent(events, type, fields) !== undefined;
    return {
      pass,
      message: () =>
        `expected ${pass ? "not " : ""}to emit ${type.name} with ${JSON.stringify(fields)}, ` +
        `emitted [${events.map((event) => event.constructor.name).join(", ")}]`,
    };
  },
);

declare module "@stackra/testing" {
  interface Matchers<R> {
    /** Asserts an event of `type` with these fields was published (by the current app, or in the received list). */
    toEmit<E extends Event>(type: AnyClass<E>, fields?: Partial<Fields<E>>): R;
  }
}
