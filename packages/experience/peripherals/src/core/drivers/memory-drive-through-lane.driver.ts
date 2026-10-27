/**
 * Stackra file contract:
 * Purpose: `MemoryDriveThroughLaneDriver`, the `DriveThroughLane` driver that records what each lane's confirm board
 *          shows and lets a test drive a car up to a lane: the only candidate this package ships for the port, so a
 *          lane's order-taking and its speed-of-service timers are testable before a sensor or board driver exists.
 * Boundary: no device is touched. Every lane answers; a lane in `offline` refuses the board calls with capability
 *           `window` and keeps its board as it was. `car(lane, isPresent)` streams a sensor reading to every `onCar`
 *           listener. The constructor takes nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0253 (decisions 1 to 3); ADR 0266 (memory drivers first); ADR 0269 (fakes are real drivers);
 *                     STA-965.
 */
import { Driver } from "@stackra/container";
import { Capability } from "@stackra/platform";
import type { CapabilityResult } from "@stackra/platform/contracts";

import { DriveThroughLane } from "#contracts/ports/drive-through-lane.port";
import type { CustomerDisplayView } from "#contracts/types/customer-display-view.type";
import type { LaneCar } from "#contracts/types/lane-car.type";
import { refuse } from "#core/functions/refuse.function";

/**
 * Drive-through lanes in memory.
 *
 * @example
 * const lanes = new MemoryDriveThroughLaneDriver();
 * lanes.onCar((car) => seen.push(car));
 * lanes.car("lane_1", true); // { lane: "lane_1", isPresent: true } to every listener
 * await lanes.confirm("lane_1", view);
 * lanes.boards.get("lane_1"); // view
 */
export class MemoryDriveThroughLaneDriver extends Driver(DriveThroughLane) {
  /** What each lane's board shows now; a cleared board has no entry. */
  readonly boards = new Map<string, CustomerDisplayView>();

  /** The lanes whose board does not answer. */
  readonly offline = new Set<string>();

  /** The car listeners. */
  private readonly listeners = new Set<(car: LaneCar) => void>();

  /** Sends a sensor reading of `lane` to every listener. */
  car(lane: string, isPresent: boolean): void {
    for (const listener of this.listeners) listener({ lane, isPresent });
  }

  /** Answers unless `lane` is offline. */
  async probe(lane: string): Promise<CapabilityResult> {
    if (this.offline.has(lane)) return refuse(Capability.Window, "unavailable");
    return { ok: true, data: undefined };
  }

  /** Records `view` as what `lane`'s board shows. */
  async confirm(lane: string, view: CustomerDisplayView): Promise<CapabilityResult> {
    if (this.offline.has(lane)) return refuse(Capability.Window, "unavailable");
    this.boards.set(lane, view);
    return { ok: true, data: undefined };
  }

  /** Clears `lane`'s board. */
  async clear(lane: string): Promise<CapabilityResult> {
    if (this.offline.has(lane)) return refuse(Capability.Window, "unavailable");
    this.boards.delete(lane);
    return { ok: true, data: undefined };
  }

  /** Streams each car reading from now on. */
  onCar(listener: (car: LaneCar) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
