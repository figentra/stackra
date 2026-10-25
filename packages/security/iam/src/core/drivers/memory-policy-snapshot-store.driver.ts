/**
 * Stackra file contract:
 * Purpose: `MemoryPolicySnapshotStoreDriver`, a `PolicySnapshotStore` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store. Keeps a snapshot only when its version is
 *           higher than the held one, like every store.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decisions 1 to 4); ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { PolicySnapshotStore } from "#contracts/index";
import type { PolicySnapshot } from "#contracts/index";

/**
 * Snapshots held in memory.
 *
 * @example
 * await store.write(rana.id, snapshot);
 */
export class MemoryPolicySnapshotStoreDriver extends Driver(PolicySnapshotStore) {
  /** Principal to snapshot. */
  private readonly snapshots = new Map<PublicId, PolicySnapshot>();

  /** The held snapshot of `principal`. */
  read(principal: PublicId): Promise<PolicySnapshot | undefined> {
    return Promise.resolve(this.snapshots.get(principal));
  }

  /** Keeps `snapshot` when it is newer. */
  write(principal: PublicId, snapshot: PolicySnapshot): Promise<boolean> {
    const held = this.snapshots.get(principal);
    if (held !== undefined && held.version >= snapshot.version) return Promise.resolve(false);
    this.snapshots.set(principal, snapshot);
    return Promise.resolve(true);
  }
}
