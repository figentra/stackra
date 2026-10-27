/**
 * Stackra file contract:
 * Purpose: `TravelMatrixRequest`, what a travel-time matrix needs: the origins, the destinations, the vehicle profile
 *          and, for a live estimate, the departure instant.
 * Boundary: a type in the leaf entry. The profile is a code the driver knows (a bike, car or van profile of the routing
 *           service), from the caller's settings; no profile is named in code here.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (`DistanceMatrix`); GRO-136 (live promise reads distance).
 */
import type { GeoPoint } from "#contracts/types/geo-point.type";

/**
 * A matrix request.
 *
 * @example
 * const matrix = await distances.matrix({ origins: [store], destinations: drops, profile: settings.profile });
 */
export interface TravelMatrixRequest {
  /** The rows, at least one. */
  readonly origins: readonly GeoPoint[];

  /** The columns, at least one. */
  readonly destinations: readonly GeoPoint[];

  /** The vehicle profile code; the driver's default when absent. */
  readonly profile?: string;

  /** The departure instant, ISO 8601 with an offset, for drivers with live traffic. */
  readonly departAt?: string;
}
