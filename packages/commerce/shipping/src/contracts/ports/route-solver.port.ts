/**
 * Stackra file contract:
 * Purpose: `RouteSolver`, the port that plans delivery routes: it places stops on vehicles within windows, shifts and
 *          compartment capacity, and orders each route.
 * Boundary: an abstract class that is its own token, key `shipping.RouteSolver`. Drivers: `memory` here; the OS
 *           `routing` service per region (VROOM over OSRM) and commercial drivers named in `region-map.providers` live
 *           in OS geography. A leaf file.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09; GRO-129; redundancy-challenge 4d; ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { RoutePlan } from "#contracts/types/route-plan.type";
import type { RouteProblem } from "#contracts/types/route-problem.type";

/**
 * Route planning.
 *
 * @example
 * const plan = await solver.solve({ vehicles, stops });
 */
export abstract class RouteSolver extends Port {
  /** Type-only port key. */
  declare readonly "~key": "shipping.RouteSolver";

  /** A plan placing every stop it can; the rest are listed in `unassigned`, never dropped. */
  abstract solve(problem: RouteProblem): Promise<RoutePlan>;
}
