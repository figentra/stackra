/**
 * Stackra file contract:
 * Purpose: `PickupPointGateway`, the capability of a carrier connection that searches its pickup points and lockers
 *          near an address, so checkout can offer them as a shipping method with a map (COM-156).
 * Boundary: an interface a connector's `Connection` implements (`CarrierCapability.PickupPoints`); see
 *           `CarrierGateway`. Pickup points are a carrier capability, not geography: only the carrier knows its points
 *           and which ones take a parcel (ADR 0369 open question 1, decided here).
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decisions 2 and 3; open question 1, COM-156).
 */
import type { PickupPoint } from "#contracts/types/pickup-point.type";
import type { PickupPointSearch } from "#contracts/types/pickup-point-search.type";

/**
 * Pickup point search.
 *
 * @example
 * const points = await gateway.searchPickupPoints({ near: address, kinds: [PickupPointKind.Locker] });
 */
export interface PickupPointGateway {
  /** The points near `search.near`, nearest first; an empty list when there are none. */
  searchPickupPoints(search: PickupPointSearch): Promise<readonly PickupPoint[]>;
}
