/**
 * Stackra file contract:
 * Purpose: `EventClass`, an event class: constructible by type only, built with its typed static `create`. The called
 *          event bases return it, and the testing helpers take it.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 19); ADR 0294 (decision 16).
 */
import type { Event } from "#core/bases/event.base";

/** A class of events `E`. */
export type EventClass<E extends Event = Event> = (abstract new () => E) &
  Pick<typeof Event, "create">;
