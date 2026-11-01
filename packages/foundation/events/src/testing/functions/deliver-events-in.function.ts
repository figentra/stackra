/**
 * Stackra file contract:
 * Purpose: `deliverEventsIn(scope)`, how a package's testing entry tells `drainOutbox()` to run each event's delivery
 *          as the production inbox does (STA-1789): `@stackra/database` registers a transaction as the event's actor in
 *          its scope.
 * Boundary: test only; the last registration wins.
 * Runtime: node
 * Governing contract: ADR 0269 (decision 3).
 */
import { DELIVERY_SCOPE } from "#testing/constants/delivery-scope.constant";
import type { DeliveryScope } from "#testing/types/delivery-scope.type";

/**
 * Registers `scope` as the way `drainOutbox()` runs each delivery.
 *
 * @example
 * deliverEventsIn((app, meta, scope, work) => Database.current().withScope(scope ?? [], work));
 */
export function deliverEventsIn(scope: DeliveryScope): void {
  DELIVERY_SCOPE.value = scope;
}
