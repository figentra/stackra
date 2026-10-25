/**
 * Stackra file contract:
 * Purpose: `LISTENER_REGISTRY`, the subscriptions gen derives from each listener's `handle` parameter type: event
 *          class to the listener classes that react to it, in registration order.
 * Boundary: written by `registerListeners` only and read by `EventBus#connect`. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4: a listener reacts to the type of its event parameter).
 */
import type { AnyClass } from "@stackra/container";

import type { Event } from "#core/bases/event.base";
import type { ListenerClass } from "#core/types/listener-class.type";

/** Event class to its listener classes. */
export const LISTENER_REGISTRY = new Map<AnyClass<Event>, ListenerClass[]>();
