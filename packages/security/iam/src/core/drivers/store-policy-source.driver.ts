/**
 * Stackra file contract:
 * Purpose: `StorePolicySourceDriver`, the production `PolicySource`: it answers each principal's snapshot from the
 *          `PolicySnapshotStore` the IAM service's events keep current, so a check costs no network hop.
 * Boundary: reads the store only. A principal with no stored snapshot holds nothing (an empty snapshot, version 0),
 *           never everything; an unreachable store throws, so the call fails closed. It reads under the principal's
 *           tenant, so a snapshot stored for another tenant never answers.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0263; build-readiness (IAM has a memory source only).
 */
import { Driver } from "@stackra/container";
import type { Actor } from "@stackra/contracts";

import { PolicySource } from "#contracts/index";
import type { PolicySnapshot, PolicySnapshotStore } from "#contracts/index";

/** What a principal with no stored snapshot holds. */
const NOTHING: PolicySnapshot = Object.freeze({
  version: 0,
  grants: [],
  roles: {},
  segments: [],
  denies: [],
  visibility: [],
});

/**
 * Snapshots from the event-fed store.
 *
 * @example
 * // gen's wiring: { port: PolicySource, candidates: { store: () => StorePolicySourceDriver } }
 * const source = new StorePolicySourceDriver(store);
 */
export class StorePolicySourceDriver extends Driver(PolicySource) {
  /** The event-fed copies. */
  private readonly store: PolicySnapshotStore;

  /**
   * @param store - the service's copy of each principal's snapshot.
   */
  constructor(store: PolicySnapshotStore) {
    super();
    this.store = store;
  }

  /**
   * The snapshot of `principal`.
   *
   * @throws Error when the store cannot be reached.
   */
  async snapshot(principal: Actor): Promise<PolicySnapshot> {
    return (await this.store.read(principal.id, principal.scopeId)) ?? NOTHING;
  }
}
