/**
 * Stackra file contract:
 * Purpose: `RouteProblem`, what a route planner solves: the vehicles, the stops and the vehicle profile its travel
 *          times use.
 * Boundary: a type in the leaf entry. The solver computes travel times itself (the OS routing service pairs VROOM with
 *           OSRM), so the problem carries points, not a matrix.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09 (`RouteSolver`); GRO-129.
 */
import type { RouteStop } from "#contracts/types/route-stop.type";
import type { RouteVehicle } from "#contracts/types/route-vehicle.type";

/**
 * A routing problem.
 *
 * @example
 * const plan = await solver.solve({ vehicles: [van], stops, profile: settings.profile });
 */
export interface RouteProblem {
  /** The vehicles, preferred first. */
  readonly vehicles: readonly RouteVehicle[];

  /** The stops to place. */
  readonly stops: readonly RouteStop[];

  /** The vehicle profile code; the driver's default when absent. */
  readonly profile?: string;
}
