/**
 * Stackra file contract:
 * Purpose: the `SyncTransport` port: how the replicas of one co-edited document exchange CRDT updates. Only the full
 *          collaboration level uses it (pages, screens, app shells, posts and articles; ADR 0270 decision 6).
 * Boundary: an abstract class that is its own token, keyed `collaboration.SyncTransport`. A driver relays opaque
 *           updates, authorises the room on the server, delivers what the other replicas hold after each open and
 *           reconnects by itself. It never parses an update and never persists one: snapshots are `SnapshotStore`'s.
 *           It is not a sync engine (no offline queue, no record sync): one live document stream per open editor.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: Yjs co-editing); ADR 0270 (decisions 5 and 6); ADR 0227 (no sync
 *                     engine); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { SyncLink } from "#contracts/types/sync-link.type";
import type { SyncLinkHandlers } from "#contracts/types/sync-link-handlers.type";

/**
 * Opens document streams.
 *
 * @example
 * const link = transport.open(room, {
 *   onOpen: () => link.send(replica.encode()),
 *   onUpdate: (update) => replica.apply(update),
 *   onClose: () => undefined,
 * });
 */
export abstract class SyncTransport extends Port {
  /** Type-only port key, so `DriverName<SyncTransport>` narrows to this port's drivers. */
  declare readonly "~key": "collaboration.SyncTransport";

  /**
   * Opens the stream of `room`'s document and reports it through `handlers`.
   *
   * @returns the stream, to send updates and to close.
   */
  abstract open(room: CollaborationRoom, handlers: SyncLinkHandlers): SyncLink;
}
