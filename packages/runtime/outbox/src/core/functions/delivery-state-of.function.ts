/**
 * Stackra file contract:
 * Purpose: `deliveryStateOf(delivery)`, where a stored cross-app delivery stands: dead once dead-lettered, failing once
 *          tried, else pending.
 * Boundary: internal; the memory driver filters by it and the operator command prints it. The Postgres driver states
 *           the same rule in SQL.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 17, amendment of 2026-11-02).
 */
import { DeliveryState } from "#contracts/index";
import type { Delivery } from "#contracts/index";

/**
 * The state of `delivery`.
 *
 * @example
 * deliveryStateOf({ ...delivery, attempts: 2 }); // "failing"
 */
export function deliveryStateOf(delivery: Delivery): DeliveryState {
  if (delivery.deadAt !== undefined) return DeliveryState.Dead;
  return delivery.attempts > 0 ? DeliveryState.Failing : DeliveryState.Pending;
}
