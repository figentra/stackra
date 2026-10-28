/**
 * Stackra file contract:
 * Purpose: `PublishedEvents`, what `app.events.published()` returns: every event the app under test published, in
 *          process or through the outbox, oldest first, with `ofType(X)` to pick one class.
 * Boundary: a type only; a frozen snapshot, so later events do not change a list a test already holds. Events
 *           received from another service (`deliverRemoteEvent`) are not published by this app and are not in it.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import type { AnyClass } from "@stackra/container";

import type { Event } from "#core/index";

/** The events an app published. */
export interface PublishedEvents extends ReadonlyArray<Event> {
  /**
   * The published events of `type` (and its subclasses), oldest first.
   *
   * @example
   * expect(app.events.published().ofType(MessageSent)).toHaveLength(1);
   */
  ofType: <E extends Event>(type: AnyClass<E>) => readonly E[];
}
