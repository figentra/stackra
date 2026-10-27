/**
 * Stackra file contract:
 * Purpose: `TravelMatrix`, what a travel-time matrix answers: whole seconds and whole metres from each origin to each
 *          destination, `null` where there is no route.
 * Boundary: a type in the leaf entry. Row `i` is `origins[i]`, column `j` is `destinations[j]` of the request.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (`DistanceMatrix`); GRO-136.
 */

/**
 * Travel times and distances.
 *
 * @example
 * const seconds = matrix.durationsS[0]?.[2]; // origin 0 to destination 2, or null
 */
export interface TravelMatrix {
  /** Travel time in whole seconds, by origin then destination; `null` when unreachable. */
  readonly durationsS: readonly (readonly (number | null)[])[];

  /** Travel distance in whole metres, by origin then destination; `null` when unreachable. */
  readonly distancesM: readonly (readonly (number | null)[])[];
}
