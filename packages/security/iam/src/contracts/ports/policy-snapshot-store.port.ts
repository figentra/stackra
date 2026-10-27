/**
 * Stackra file contract:
 * Purpose: the `PolicySnapshotStore` port: the consuming service's local copy of each principal's policy snapshot,
 *          kept current by the IAM service's events: read one, write a newer one.
 * Boundary: an abstract class that is its own token. A server driver keeps the copies in the service's own store; the
 *           memory driver serves tests. `write` keeps a snapshot only when its version is higher than the one held, so
 *           an event delivered late or twice never rolls a policy back. Copies are tenant-scoped (STA-815): a principal's
 *           snapshot is held under the tenant the event named, and read under the caller's tenant, so a snapshot of one
 *           tenant never answers a call in another; no tenant (a platform principal) is its own partition.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4: snapshots pushed by events, checked in process); ADR 0263; ADR 0239 (tenant equality); STA-815.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { PolicySnapshot } from "#contracts/types/policy-snapshot.type";

/**
 * Keeps policy snapshots.
 *
 * @example
 * await store.write(event.principal, decodePolicySnapshot(event.snapshot), meta.scopeId);
 */
export abstract class PolicySnapshotStore extends Port {
  /**
   * The snapshot held for `principal` in `scopeId` (none for a platform principal), or `undefined`.
   *
   * @throws Error when the store cannot be reached.
   */
  abstract read(principal: PublicId, scopeId?: PublicId): Promise<PolicySnapshot | undefined>;

  /**
   * Keeps `snapshot` for `principal` in `scopeId` when its version is higher than the held one; `true` when it was
   * kept.
   *
   * @throws Error when the store cannot be reached.
   */
  abstract write(
    principal: PublicId,
    snapshot: PolicySnapshot,
    scopeId?: PublicId,
  ): Promise<boolean>;
}
