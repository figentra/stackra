/**
 * Stackra file contract:
 * Purpose: `PushEvent`, a Web Push delivery: its data, read as JSON.
 * Boundary: a structural type; the browser's `PushEvent` satisfies it.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 3).
 */
import type { ExtendableEvent } from "#sw/types/extendable-event.type";

/** One push message delivered to the service worker. */
export interface PushEvent extends ExtendableEvent {
  /** The payload, or null for a push without one. */
  readonly data: { json: () => unknown } | null;
}
