/**
 * Stackra file contract:
 * Purpose: `EventsHarness`, the event plumbing of one compiled testing app: its bus, its outbox, the memory inbox
 *          `deliverRemoteEvent` fills and the event ids the inbox has seen.
 * Boundary: a type only; built by the events testing plugin when an app compiles. Internal: not exported from the
 *           entry.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3); ADR 0078 (decision 4: inbox dedup by event id).
 */
import type { EventMeta, EventOutbox } from "#contracts/index";
import type { Event, EventBus } from "#core/index";

/** One app's bus, outbox and inbox. */
export interface EventsHarness {
  /** The app's bus, subscribed to every registered listener the app binds. */
  readonly bus: EventBus;

  /** The app's outbox; `drainOutbox()` needs it to be an `OutboxFake`. */
  readonly outbox: EventOutbox;

  /** Remote events received and not yet delivered, oldest first. */
  readonly inbox: { readonly event: Event; readonly meta: Partial<EventMeta> }[];

  /** The ids the inbox has delivered, so a redelivery runs no listener. */
  readonly seen: Set<string>;
}
