/**
 * Stackra file contract:
 * Purpose: `Pickup`, a booked courier collection: the carrier's id and the window it confirmed.
 * Boundary: a type in the leaf entry. A carrier may confirm a narrower window than asked.
 * Runtime: isomorphic
 * Governing contract: ADR 0369 (decision 2).
 */

/**
 * A booked collection.
 *
 * @example
 * await gateway.cancelPickup(pickup.pickupId);
 */
export interface Pickup {
  /** The carrier's id of the booking. */
  readonly pickupId: string;

  /** The confirmed earliest time (ISO 8601 with offset). */
  readonly from: string;

  /** The confirmed latest time (ISO 8601 with offset). */
  readonly to: string;
}
