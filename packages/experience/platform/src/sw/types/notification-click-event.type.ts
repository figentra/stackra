/**
 * Stackra file contract:
 * Purpose: `NotificationClickEvent`, a click on a notification the worker showed: the notification, with the data the
 *          push handler stored on it (`{ route }`).
 * Boundary: a structural type; the browser's `NotificationEvent` satisfies it.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 3).
 */
import type { ExtendableEvent } from "#sw/types/extendable-event.type";

/** A notification click. */
export interface NotificationClickEvent extends ExtendableEvent {
  /** The clicked notification. */
  readonly notification: { readonly data: unknown; close: () => void };
}
