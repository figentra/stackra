/**
 * Stackra file contract:
 * Purpose: the `PresenceChannel` port: how a client joins a room's presence, sees who else is there and shares its
 *          cursor. Every collaboration level but OCC-only uses it (ADR 0270 decision 6): structured documents get
 *          presence without co-editing.
 * Boundary: an abstract class that is its own token, keyed `collaboration.PresenceChannel`. A driver authenticates
 *           and authorises the room on the server and stamps each peer's principal there; it reconnects by itself.
 *           Entitlement and ref-counting are `CollaborationSession`'s. Presence is ephemeral: nothing here is stored.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decisions 1 and 2: authenticated channels, presence and cursors); ADR 0270 (decisions
 *                     5 and 6); ADR 0294 (decisions 4, 15 and 16); ADR 0263 (ports resolve by type).
 */
import { Port } from "@stackra/contracts";

import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";
import type { PresenceLink } from "#contracts/types/presence-link.type";
import type { PresenceLinkHandlers } from "#contracts/types/presence-link-handlers.type";

/**
 * Joins rooms' presence.
 *
 * @example
 * const link = channel.join({ document: "pag_01j9z3k4m5n6p7q8r9s0t1v2w3" }, {
 *   onOpen: () => setLive(true),
 *   onPeers: (peers) => setPeers(peers),
 *   onClose: () => setLive(false),
 * });
 * link.move({ x: 120, y: 48 });
 */
export abstract class PresenceChannel extends Port {
  /** Type-only port key, so `DriverName<PresenceChannel>` narrows to this port's drivers. */
  declare readonly "~key": "collaboration.PresenceChannel";

  /**
   * Joins `room` and reports it through `handlers`.
   *
   * @returns the membership, to move the cursor and to leave.
   */
  abstract join(room: CollaborationRoom, handlers: PresenceLinkHandlers): PresenceLink;
}
