/**
 * Stackra file contract:
 * Purpose: the `PlanSnapshots` port: the effective plan of a scope, as the plan service's events keep it current in
 *          the consuming service.
 * Boundary: an abstract class that is its own token. A server driver reads the event-fed projection; the memory driver
 *           serves tests and local runs. It answers and composes nothing; `undefined` is a scope with no plan, whose
 *           every right is refused.
 * Runtime: isomorphic
 * Governing contract: ADR 0215 (decisions 5 and 6: the plan service composes, consumers read a snapshot); ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { PlanSnapshot } from "#contracts/types/plan-snapshot.type";

/**
 * Reads a scope's plan.
 *
 * @example
 * const plan = await snapshots.read(call.scope?.id);
 */
export abstract class PlanSnapshots extends Port {
  /**
   * The plan of `scope`, or `undefined` when it has none.
   *
   * @throws Error when the store cannot be reached.
   */
  abstract read(scope: PublicId | undefined): Promise<PlanSnapshot | undefined>;
}
