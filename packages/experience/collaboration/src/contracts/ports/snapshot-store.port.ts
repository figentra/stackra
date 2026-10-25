/**
 * Stackra file contract:
 * Purpose: the `SnapshotStore` port: where the saved state of a co-edited document lives, so an editor that opens it
 *          with no peer online restores the latest state.
 * Boundary: an abstract class that is its own token, keyed `collaboration.SnapshotStore`. A driver isolates snapshots
 *           by the room's scope and decides retention (keeping the latest is enough: versions and history are the
 *           content type's, ADR 0270 decision 2). A failing call rejects; it never reports success for a lost save.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: state saved as snapshots); ADR 0270 (decisions 2 and 5); ADR 0294
 *                     (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { DocumentSnapshot } from "#contracts/types/document-snapshot.type";

/**
 * Saves and loads document snapshots.
 *
 * @example
 * export class ContentSnapshotStoreDriver extends Driver(SnapshotStore) {
 *   save(room: CollaborationRoom, snapshot: DocumentSnapshot): Promise<void> {
 *     return this.documents.saveState(room.document, snapshot.state);
 *   }
 * }
 */
export abstract class SnapshotStore extends Port {
  /** Type-only port key, so `DriverName<SnapshotStore>` narrows to this port's drivers. */
  declare readonly "~key": "collaboration.SnapshotStore";

  /** Saves `snapshot` as the latest state of `room`'s document. */
  abstract save(room: CollaborationRoom, snapshot: DocumentSnapshot): Promise<void>;

  /** The latest saved state of `room`'s document, or `undefined` when none was saved. */
  abstract latest(room: CollaborationRoom): Promise<DocumentSnapshot | undefined>;
}
