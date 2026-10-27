/**
 * Stackra file contract:
 * Purpose: `PickupPoint`, one carrier pickup point or locker a recipient can collect from: the carrier's point id, its
 *          kind, name and address, the distance from the searched address and the opening hours as the carrier gives
 *          them.
 * Boundary: a type in the leaf entry. `pointId` goes back on `LabelRequest.pickupPointId`. The address is a business
 *           location, not personal data. Hours are carrier text, shown as given, never parsed here.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (open question 1, COM-156).
 */
import type { PickupPointKind } from "#contracts/enums/pickup-point-kind.enum";
import type { ShippingAddress } from "#contracts/types/shipping-address.type";

/**
 * A place to collect a parcel.
 *
 * @example
 * const request: LabelRequest = { ...base, pickupPointId: point.pointId };
 */
export interface PickupPoint {
  /** The carrier's id of the point. */
  readonly pointId: string;

  /** Locker or counter. */
  readonly kind: PickupPointKind;

  /** The name the carrier shows (the shop or locker name). */
  readonly name: string;

  /** Where it is; carries coordinates when the carrier gives them, for the map. */
  readonly address: ShippingAddress;

  /** Distance from the searched address in whole metres, when the carrier says. */
  readonly distanceM?: number;

  /** Opening hours as the carrier gives them, one line each. */
  readonly hours?: readonly string[];
}
