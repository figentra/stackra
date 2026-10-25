/**
 * Stackra file contract:
 * Purpose: `MemoryPlanSnapshotsDriver`, a `PlanSnapshots` over plans held in memory, for tests and local runs: `load`
 *          sets the plan of one scope (`undefined` for the platform-wide plan) and raises its version.
 * Boundary: process-local and unsynchronised; never a production store. It starts empty, so every right is refused
 *           until a plan is loaded.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decision 5); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { PlanSnapshots } from "#contracts/ports/plan-snapshots.port";
import type { PlanSnapshot } from "#contracts/types/plan-snapshot.type";

/**
 * Plans held in memory.
 *
 * @example
 * snapshots.load(acme.id, { grants: { "catalogue.product_limit": 2 }, seats: { provider: 3 } });
 */
export class MemoryPlanSnapshotsDriver extends Driver(PlanSnapshots) {
  /** Scope id (or `undefined`) to its plan. */
  private readonly plans = new Map<PublicId | undefined, PlanSnapshot>();

  /** Sets the plan of `scope`, one version above the plan it replaces. */
  load(scope: PublicId | undefined, plan: Omit<PlanSnapshot, "version">): void {
    const version = (this.plans.get(scope)?.version ?? 0) + 1;
    this.plans.set(scope, Object.freeze({ ...plan, version }));
  }

  /** The plan of `scope`, or `undefined`. */
  read(scope: PublicId | undefined): Promise<PlanSnapshot | undefined> {
    return Promise.resolve(this.plans.get(scope));
  }
}
