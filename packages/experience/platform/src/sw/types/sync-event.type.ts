/**
 * Stackra file contract:
 * Purpose: `SyncEvent`, the Background Sync event: the tag the page registered (`stackra_outbox`).
 * Boundary: a structural type; the browser's `SyncEvent` satisfies it.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 4); ADR 0252 (the outbox).
 */
import type { ExtendableEvent } from "#sw/types/extendable-event.type";

/** A Background Sync wake-up. */
export interface SyncEvent extends ExtendableEvent {
  /** The tag the page registered. */
  readonly tag: string;
}
