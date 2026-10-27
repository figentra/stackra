/**
 * Stackra file contract:
 * Purpose: `MemoryPolicySnapshotStoreDriver`, a `PolicySnapshotStore` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store. Keeps a snapshot only when its version is
 *           higher than the held one, like every store, and partitions by tenant like the Postgres store.
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
  /** `<tenant>:<principal>` to snapshot; `-` stands for no tenant. */
  private readonly snapshots = new Map<string, PolicySnapshot>();

  /** The held snapshot of `principal` in `scopeId`. */
  read(principal: PublicId, scopeId?: PublicId): Promise<PolicySnapshot | undefined> {
    return Promise.resolve(this.snapshots.get(`${scopeId ?? "-"}:${principal}`));
  }

  /** Keeps `snapshot` when it is newer than the one held in the same tenant. */
  write(principal: PublicId, snapshot: PolicySnapshot, scopeId?: PublicId): Promise<boolean> {
    const key = `${scopeId ?? "-"}:${principal}`;
    const held = this.snapshots.get(key);
    if (held !== undefined && held.version >= snapshot.version) return Promise.resolve(false);
    this.snapshots.set(key, snapshot);
    return Promise.resolve(true);
  }
}
