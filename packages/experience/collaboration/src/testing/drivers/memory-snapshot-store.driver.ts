/**
 * Stackra file contract:
 * Purpose: the `memory` driver of the `SnapshotStore` port: the latest snapshot per document in process, for tests.
 * Boundary: test code only, so it ships in `./testing`; keeps the latest snapshot only (retention is a store's choice)
 *           and resolves before the caller's next step, so a test reads `latest` right after a save.
 * Runtime: node
 * Governing contract: ADR 0266 (decision 2: memory driver first); ADR 0269 (decision 3); ADR 0225 (decision 2).
 */
import { Driver } from "@stackra/container";

import { SnapshotStore } from "#contracts/index";
import type { CollaborationRoom, DocumentSnapshot } from "#contracts/index";

/**
 * Snapshots in process.
 *
 * @example
 * const store = new MemorySnapshotStoreDriver();
 * await store.save(room, { state, savedAt: new Date() });
 */
export class MemorySnapshotStoreDriver extends Driver(SnapshotStore) {
  private readonly snapshots = new Map<string, DocumentSnapshot>();

  /** Keeps `snapshot` as the latest of `room`'s document. */
  save(room: CollaborationRoom, snapshot: DocumentSnapshot): Promise<void> {
    this.snapshots.set(room.document, snapshot);
    return Promise.resolve();
  }

  /** The latest snapshot of `room`'s document. */
  latest(room: CollaborationRoom): Promise<DocumentSnapshot | undefined> {
    return Promise.resolve(this.snapshots.get(room.document));
  }
}
