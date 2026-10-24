/**
 * Stackra file contract:
 * Purpose: `WorkerMessageEvent`, a message a page posted to the service worker (`{ type: "skip_waiting" }`).
 * Boundary: a structural type; the browser's `ExtendableMessageEvent` satisfies it.
 * Runtime: worker
 * Governing contract: ADR 0255.
 */
import type { ExtendableEvent } from "#sw/types/extendable-event.type";

/** A page's message to the worker. */
export interface WorkerMessageEvent extends ExtendableEvent {
  /** What the page posted. */
  readonly data: unknown;
}
