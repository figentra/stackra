/**
 * Stackra file contract:
 * Purpose: the `PolicySnapshotStore` port: the consuming service's local copy of each principal's policy snapshot,
 *          kept current by the IAM service's events: read one, write a newer one.
 * Boundary: an abstract class that is its own token. A server driver keeps the copies in the service's own store; the
 *           memory driver serves tests. `write` keeps a snapshot only when its version is higher than the one held, so
 *           an event delivered late or twice never rolls a policy back.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4: snapshots pushed by events, checked in process); ADR 0263.
 */
import { Port, type PublicId } from "@stackra/contracts";

import type { PolicySnapshot } from "#contracts/types/policy-snapshot.type";

/**
 * Keeps policy snapshots.
 *
 * @example
 * await store.write(event.principal, decodePolicySnapshot(event.snapshot));
 */
export abstract class PolicySnapshotStore extends Port {
  /**
   * The snapshot held for `principal`, or `undefined`.
   *
   * @throws Error when the store cannot be reached.
   */
  abstract read(principal: PublicId): Promise<PolicySnapshot | undefined>;

  /** Keeps `snapshot` for `principal` when its version is higher than the held one; `true` when it was kept. */
  abstract write(principal: PublicId, snapshot: PolicySnapshot): Promise<boolean>;
}
