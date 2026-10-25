/**
 * Stackra file contract:
 * Purpose: `PickupRequest`, a courier collection booking: the idempotency reference, where to collect, the window and
 *          the shipments to hand over.
 * Boundary: a type in the leaf entry. The window is two ISO 8601 instants with offsets; which windows a location offers
 *           is the consumer's settings and calendar.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2 and 3).
 */
import type { ShippingParty } from "#contracts/types/shipping-party.type";

/**
 * A pickup booking.
 *
 * @example
 * const pickup = await gateway.schedulePickup({ reference: runId, location, from, to, shipmentIds });
 */
export interface PickupRequest {
  /** The caller's id for this booking; the same reference never books twice. */
  readonly reference: string;

  /** Where the courier collects, with a contact. */
  readonly location: ShippingParty;

  /** The earliest collection time (ISO 8601 with offset). */
  readonly from: string;

  /** The latest collection time (ISO 8601 with offset). */
  readonly to: string;

  /** The carrier shipment ids handed over. */
  readonly shipmentIds: readonly string[];
}
