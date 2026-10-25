/**
 * Stackra file contract:
 * Purpose: `PushSubscriptionChangeEvent`, the browser's notice that it rotated or dropped the push subscription: the
 *          old subscription, whose options the worker subscribes again with.
 * Boundary: a structural type; the browser's `PushSubscriptionChangeEvent` satisfies it.
 * Runtime: worker
 * Governing contract: ADR 0255 (decision 3).
 */
import type { ExtendableEvent } from "#sw/types/extendable-event.type";

/** A rotated push subscription. */
export interface PushSubscriptionChangeEvent extends ExtendableEvent {
  /** The subscription that ended, or null when the browser does not say. */
  readonly oldSubscription: { readonly options: PushSubscriptionOptions } | null;
}
