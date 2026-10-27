/**
 * Stackra file contract:
 * Purpose: `MemoryDistanceMatrixDriver`, the `DistanceMatrix` driver that answers from legs a test or a local run puts
 *          in `legs`: the `memory` candidate, so the delivery promise and dispatch are testable before the OS routing
 *          service is reachable.
 * Boundary: no network and no geometry guess: a pair with no leg is `null` (unreachable), a point to itself is 0. The
 *           profile and departure instant are ignored. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers); R3-SO-09; GRO-136.
 */
import { Driver } from "@stackra/container";
import type { GeoPoint } from "@stackra/contracts";

import { DistanceMatrix } from "#contracts/ports/distance-matrix.port";
import type { TravelMatrix } from "#contracts/types/travel-matrix.type";
import type { TravelMatrixRequest } from "#contracts/types/travel-matrix-request.type";

/** True when both points are the same place. */
const same = (a: GeoPoint, b: GeoPoint): boolean =>
  a.latitude === b.latitude && a.longitude === b.longitude;

/**
 * Travel times in memory.
 *
 * @example
 * const distances = new MemoryDistanceMatrixDriver();
 * distances.legs.push({ from: store, to: door, durationS: 600, distanceM: 4_000 });
 * await distances.matrix({ origins: [store], destinations: [door] });
 */
export class MemoryDistanceMatrixDriver extends Driver(DistanceMatrix) {
  /** The legs it knows, one direction each. */
  readonly legs: {
    readonly from: GeoPoint;
    readonly to: GeoPoint;
    readonly durationS: number;
    readonly distanceM: number;
  }[] = [];

  /** Each origin to each destination from `legs`; `null` where no leg is known. */
  async matrix(request: TravelMatrixRequest): Promise<TravelMatrix> {
    const cell = (from: GeoPoint, to: GeoPoint) =>
      same(from, to)
        ? { durationS: 0, distanceM: 0 }
        : this.legs.find((leg) => same(leg.from, from) && same(leg.to, to));
    const rows = request.origins.map((from) => request.destinations.map((to) => cell(from, to)));
    return {
      durationsS: rows.map((row) => row.map((leg) => leg?.durationS ?? null)),
      distancesM: rows.map((row) => row.map((leg) => leg?.distanceM ?? null)),
    };
  }
}
