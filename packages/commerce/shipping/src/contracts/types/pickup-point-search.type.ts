/**
 * Stackra file contract:
 * Purpose: `PickupPointSearch`, what a pickup point search needs: the address to search near, and optionally a radius,
 *          a result limit, the kinds wanted and the parcels the point must take.
 * Boundary: a type in the leaf entry. The radius and limit come from the caller's settings, never from code here; a
 *           connector that cannot filter by one of them filters its own results. Personal data: `near` may be the
 *           recipient's address.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (open question 1, COM-156).
 */
import type { PickupPointKind } from "#contracts/enums/pickup-point-kind.enum";
import type { Parcel } from "#contracts/types/parcel.type";
import type { ShippingAddress } from "#contracts/types/shipping-address.type";

/**
 * A pickup point search.
 *
 * @example
 * const points = await gateway.searchPickupPoints({ near: address, radiusM: settings.radiusM, limit: 10 });
 */
export interface PickupPointSearch {
  /** The address to search near; coordinates are used when present. */
  readonly near: ShippingAddress;

  /** The search radius in whole metres. */
  readonly radiusM?: number;

  /** The most points to return. */
  readonly limit?: number;

  /** Only these kinds; every kind when absent. */
  readonly kinds?: readonly PickupPointKind[];

  /** The parcels the point must accept (a locker's compartment sizes). */
  readonly parcels?: readonly Parcel[];
}
