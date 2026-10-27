/**
 * Stackra file contract:
 * Purpose: `DistanceMatrix`, the port that answers travel times and distances between points: the live delivery promise
 *          and a dispatcher's nearest rider read it.
 * Boundary: an abstract class that is its own token, key `shipping.DistanceMatrix`. Drivers: `memory` here; the OS
 *           `routing` service per region (OSRM) and commercial drivers named in `region-map.providers` live in OS
 *           geography. A leaf file.
 * Runtime: isomorphic
 * Governing contract: R3-SO-09; GRO-129; GRO-136; redundancy-challenge 4d (the solver is the OS routing service, the
 *                     port is Stackra); ADR 0294 (decision 16).
 */
import { Port } from "@stackra/contracts";

import type { TravelMatrix } from "#contracts/types/travel-matrix.type";
import type { TravelMatrixRequest } from "#contracts/types/travel-matrix-request.type";

/**
 * Travel times between points.
 *
 * @example
 * const { durationsS } = await distances.matrix({ origins: [store], destinations: [door] });
 */
export abstract class DistanceMatrix extends Port {
  /** Type-only port key. */
  declare readonly "~key": "shipping.DistanceMatrix";

  /** The times and distances from every origin to every destination. */
  abstract matrix(request: TravelMatrixRequest): Promise<TravelMatrix>;
}
