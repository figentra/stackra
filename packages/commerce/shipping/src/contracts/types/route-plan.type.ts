/**
 * Stackra file contract:
 * Purpose: `RoutePlan`, what a route planner answers: one route per vehicle with its ordered visits, arrival and
 *          departure instants and totals, and the stops it could not place.
 * Boundary: a type in the leaf entry. Every vehicle of the problem has a route, empty when unused; every stop is in
 *           exactly one route or in `unassigned`. Instants are ISO 8601.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (`RouteSolver`); GRO-129.
 */

/**
 * A route planner's answer: one route per vehicle and the stops it could not place.
 *
 * @example
 * for (const route of plan.routes) dispatch(route.vehicleId, route.visits.map((visit) => visit.stopId));
 */
export interface RoutePlan {
  /** One route per vehicle, in the problem's vehicle order. */
  readonly routes: readonly {
    /** The vehicle's id. */
    readonly vehicleId: string;

    /** The stops in driving order. */
    readonly visits: readonly {
      /** The stop's id. */
      readonly stopId: string;

      /** When the vehicle is there, ISO 8601. */
      readonly arriveAt: string;

      /** When it leaves after the hand-over, ISO 8601. */
      readonly departAt: string;
    }[];

    /** Total driving distance in whole metres. */
    readonly distanceM: number;

    /** Total time from the shift start to the last departure, in whole seconds. */
    readonly durationS: number;
  }[];

  /** The ids of the stops no vehicle could take. */
  readonly unassigned: readonly string[];
}
