/**
 * Stackra file contract:
 * Purpose: the `PolicySource` port: where the decision point reads one principal's policy snapshot from.
 * Boundary: an abstract class that is its own token. A server driver reads the snapshot the IAM service's events keep
 *           current; `MemoryPolicySourceDriver` serves tests and local runs. A source answers and composes nothing:
 *           evaluation is the decision point's. An unknown principal gets an empty snapshot, never everything.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";

import type { PolicySnapshot } from "#contracts/types/policy-snapshot.type";

/**
 * Answers a principal's policy.
 *
 * @example
 * export class EventPolicySourceDriver extends Driver(PolicySource) {
 *   snapshot(principal: Actor): Promise<PolicySnapshot> {
 *     return this.store.read(principal.id);
 *   }
 * }
 */
export abstract class PolicySource extends Port {
  /**
   * The snapshot of `principal` (one link of a call's actor chain, never its delegate).
   *
   * @throws Error when the source cannot be reached; the call then fails, never as allowed.
   */
  abstract snapshot(principal: Actor): Promise<PolicySnapshot>;
}
