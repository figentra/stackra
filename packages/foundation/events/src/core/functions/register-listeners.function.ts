/**
 * Stackra file contract:
 * Purpose: `registerListeners`, which records which listener classes react to which event class. Gen calls it once
 *          per member from the generated events file, with the pairs it read from each listener's `handle` parameter
 *          type; a test calls it for its own fixtures.
 * Boundary: writes the registry only; a pair registered again is kept once. Nothing is subscribed until a bus
 *           `connect`s to a container, which resolves the listener instances. The event may be another service's: the
 *           class gen writes into `#stackra/clients/<service>` (an `IntegrationEvent` at runtime, typed by its payload),
 *           so a pair takes any class, never a wire name (ADR 0260: no string-keyed subscription).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 4); ADR 0260 (decision 3: a remote event is a generated class).
 */
import type { AnyClass } from "@stackra/container";

import { LISTENER_REGISTRY } from "#core/constants/listener-registry.constant";
import type { ListenerClass } from "#core/types/listener-class.type";

/**
 * Records each `[EventClass, ListenerClass]` pair.
 *
 * @example
 * registerListeners([
 *   [OrderPaid, EarnOnOrderPaidListener], // OrderPaid from #stackra/clients/orders
 *   [OrderPlaced, SettleOnOrderPlacedListener],
 * ]);
 */
export function registerListeners(pairs: readonly (readonly [AnyClass, ListenerClass])[]): void {
  for (const [event, listener] of pairs) {
    const listeners = LISTENER_REGISTRY.get(event) ?? [];
    if (!listeners.includes(listener)) listeners.push(listener);
    LISTENER_REGISTRY.set(event, listeners);
  }
}
