/**
 * Stackra file contract:
 * Purpose: the `DriveThroughLane` port: the hardware of a drive-through lane. It streams the car sensor (a car arrived
 *          at or left the order point), shows the order on the car-facing confirm board and clears it, and answers a
 *          probe of the board, each board call as a `CapabilityResult` that refuses with capability `window` when the
 *          board is not there.
 * Boundary: an abstract class that is its own token, keyed `peripherals.DriveThroughLane`. A venue has several lanes,
 *           so every call names one (the product's lane key). The sensor is optional per lane: a lane with none
 *           simply sends no car events, and the product starts its timers on order-taking instead. Timers, targets
 *           and the queue are the product's. Only the `memory` driver ships; a sensor or board vendor's driver needs
 *           its own ADR.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0339 (decision 1); ADR 0250 (decision 3); ADR 0294 (decisions
 *                     15 and 16); STA-965.
 */
import { Port } from "@stackra/contracts";
import type { CapabilityResult } from "@stackra/platform/contracts";

import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import type { LaneCar } from "#contracts/types/lane-car.type";

/**
 * The drive-through lanes.
 *
 * @example
 * const stop = lanes.onCar((car) => car.isPresent && timers.startOrder(car.lane));
 * await lanes.confirm("lane_1", { lines, total: "SAR 36.00", message: "Please drive forward" });
 */
export abstract class DriveThroughLane extends Port {
  /** Type-only port key. */
  declare readonly "~key": "peripherals.DriveThroughLane";

  /** Whether the confirm board of `lane` answers now. */
  abstract probe(lane: string): Promise<CapabilityResult>;

  /** Shows `view` on the confirm board of `lane`, replacing the one before. */
  abstract confirm(lane: string, view: CustomerDisplayView): Promise<CapabilityResult>;

  /** Clears the confirm board of `lane` (the idle screen). */
  abstract clear(lane: string): Promise<CapabilityResult>;

  /** Calls `listener` each time a lane's sensor sees a car arrive or leave, until the returned function stops it. */
  abstract onCar(listener: (car: LaneCar) => void): () => void;
}
