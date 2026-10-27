/**
 * Stackra file contract:
 * Purpose: `MemoryRouteSolverDriver`, the `RouteSolver` driver that plans without a map: the `memory` candidate, so the
 *          route planner and the driver view are testable before the OS routing service is reachable.
 * Boundary: no network and no optimisation. Stops are taken in the order given; each goes on the first vehicle with
 *           room in every compartment that can arrive inside its window and finish inside its shift, else it is
 *           unassigned. Travel takes no time and no distance, so arrival is the later of the vehicle's last departure
 *           and the window's start. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); R3-SO-09; GRO-129.
 */
import { Driver } from "@stackra/container";

import { RouteSolver } from "#contracts/ports/route-solver.port";
import type { RoutePlan } from "#contracts/types/route-plan.type";
import type { RouteProblem } from "#contracts/types/route-problem.type";
import type { RouteStop } from "#contracts/types/route-stop.type";

type Visit = RoutePlan["routes"][number]["visits"][number];

/** Arrival and departure, in epoch milliseconds, of `stop` for a vehicle free from `cursor`. */
const timing = (cursor: number, stop: RouteStop): { arrive: number; depart: number } => {
  const arrive = Math.max(cursor, stop.window ? Date.parse(stop.window.from) : cursor);
  return { arrive, depart: arrive + (stop.serviceS ?? 0) * 1_000 };
};

/**
 * Routes in memory.
 *
 * @example
 * const plan = await new MemoryRouteSolverDriver().solve({ vehicles: [van], stops });
 */
export class MemoryRouteSolverDriver extends Driver(RouteSolver) {
  /** First fit in stop order; see the file contract. */
  async solve(problem: RouteProblem): Promise<RoutePlan> {
    const routes = problem.vehicles.map((vehicle) => ({
      vehicle,
      load: {} as Record<string, number>,
      cursor: Date.parse(vehicle.shift.from),
      visits: [] as Visit[],
    }));
    const unassigned: string[] = [];
    for (const stop of problem.stops) {
      const route = routes.find(({ vehicle, load, cursor }) => {
        const fits = Object.entries(stop.demand).every(
          ([code, units]) => (load[code] ?? 0) + units <= (vehicle.capacity[code] ?? 0),
        );
        const { arrive, depart } = timing(cursor, stop);
        return (
          fits &&
          (stop.window === undefined || arrive <= Date.parse(stop.window.to)) &&
          depart <= Date.parse(vehicle.shift.to)
        );
      });
      if (route === undefined) {
        unassigned.push(stop.stopId);
        continue;
      }
      const { arrive, depart } = timing(route.cursor, stop);
      route.cursor = depart;
      for (const [code, units] of Object.entries(stop.demand))
        route.load[code] = (route.load[code] ?? 0) + units;
      route.visits.push({
        stopId: stop.stopId,
        arriveAt: new Date(arrive).toISOString(),
        departAt: new Date(route.cursor).toISOString(),
      });
    }
    return {
      routes: routes.map(({ vehicle, cursor, visits }) => ({
        vehicleId: vehicle.vehicleId,
        visits,
        distanceM: 0,
        durationS: visits.length === 0 ? 0 : (cursor - Date.parse(vehicle.shift.from)) / 1_000,
      })),
      unassigned,
    };
  }
}
