/**
 * Stackra file contract:
 * Purpose: `PickupGateway`, the capability of a carrier connection that books a courier collection and cancels it.
 * Boundary: an interface a connector's `Connection` implements (`CarrierCapability.Pickups`); see `CarrierGateway`.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2 and 3).
 */
import type { Pickup } from "#contracts/types/pickup.type";
import type { PickupRequest } from "#contracts/types/pickup-request.type";

/**
 * Pickups.
 *
 * @example
 * const pickup = await gateway.schedulePickup(request);
 * await gateway.cancelPickup(pickup.pickupId);
 */
export interface PickupGateway {
  /** Books a collection; a repeated `request.reference` returns the booking already made. */
  schedulePickup(request: PickupRequest): Promise<Pickup>;

  /** Cancels a booking; cancelling twice is not an error. */
  cancelPickup(pickupId: string): Promise<void>;
}
