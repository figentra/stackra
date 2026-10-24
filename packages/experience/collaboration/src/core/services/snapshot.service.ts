/**
 * Stackra file contract:
 * Purpose: `SnapshotService`, the persistence of co-edited documents: it restores a replica from the latest snapshot,
 *          saves its full state, and while a replica is tracked saves at most once per `snapshotIntervalSeconds` after
 *          local changes and once more when tracking stops.
 * Boundary: a singleton service over the `SnapshotStore` port. Only local changes start a save, so each change is saved
 *           by the client that made it and N open editors do not save N times. Not entitlement-gated: a document
 *           opens and saves without live collaboration. A failed tracked save is logged and the next local change
 *           saves the full state again; a direct `save` rejects to its caller. Retention is the store's.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: state saved as snapshots); ADR 0270 (decisions 2 and 5); ADR 0294
 *                     (decisions 16 and 17).
 */
import { Service } from "@stackra/container";

import { CollaborationConfig } from "#config/collaboration.config";
import { SnapshotStore } from "#contracts/ports/snapshot-store.port";
import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { DocumentReplica } from "#contracts/types/document-replica.type";

/**
 * Saves and restores document snapshots.
 *
 * @example
 * await snapshots.restore(room, replica);
 * const stop = snapshots.track(room, replica);
 * stop(); // saves pending changes
 */
export class SnapshotService extends Service {
  private readonly config: CollaborationConfig;

  private readonly store: SnapshotStore;

  /**
   * @param config - the snapshot interval.
   * @param store - where snapshots live.
   */
  constructor(config: CollaborationConfig, store: SnapshotStore) {
    super();
    this.config = config;
    this.store = store;
  }

  /**
   * Applies the latest snapshot of `room`'s document to `replica`.
   *
   * @returns whether a snapshot was found.
   */
  async restore(room: CollaborationRoom, replica: DocumentReplica): Promise<boolean> {
    const snapshot = await this.store.latest(room);
    if (snapshot === undefined) return false;
    replica.apply(snapshot.state);
    return true;
  }

  /** Saves `replica`'s full state as the latest snapshot of `room`'s document. */
  save(room: CollaborationRoom, replica: DocumentReplica): Promise<void> {
    return this.store.save(room, { state: replica.encode(), savedAt: new Date() });
  }

  /**
   * Saves `replica` at most once per interval while local changes arrive.
   *
   * @returns stops tracking and saves changes not yet saved (idempotent).
   */
  track(room: CollaborationRoom, replica: DocumentReplica): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = (): void => {
      timer = undefined;
      this.save(room, replica).catch((error: unknown) => {
        // Report a store outage; the next local change saves the full state again.
        console.error(`A snapshot of ${room.document} failed`, error);
      });
    };
    const stopUpdates = replica.onUpdate(() => {
      timer ??= setTimeout(flush, this.config.snapshotIntervalSeconds * 1000);
    });
    let tracking = true;
    return () => {
      if (!tracking) return;
      tracking = false;
      stopUpdates();
      if (timer === undefined) return;
      clearTimeout(timer);
      flush();
    };
  }
}
