/**
 * Stackra file contract:
 * Purpose: `ListenerDelivery`, the outcome of handing one recorded event to one listener: what `EventBus#drain`
 *          returns and what `app.listeners.calls` and `.failures` read.
 * Boundary: a type only; `error` is present exactly when `handle` threw or rejected.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 (decisions 1 and 2: a failing listener never stops the others or the emitter).
 */
import type { RecordedEvent } from "#contracts/types/recorded-event.type";
import type { Event } from "#core/bases/event.base";
import type { Listener } from "#core/bases/listener.base";

/** One delivery of one event to one listener. */
export interface ListenerDelivery {
  /** The listener that received it. */
  readonly listener: Listener;

  /** The event and its metadata. */
  readonly record: RecordedEvent<Event>;

  /** What `handle` threw; absent when it succeeded. */
  readonly error?: unknown;
}
