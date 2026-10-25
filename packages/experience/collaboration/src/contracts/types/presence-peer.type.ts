/**
 * Stackra file contract:
 * Purpose: `PresencePeer`, one other connection in a room: whose it is and where its cursor is.
 * Boundary: a type only, in the leaf entry. The principal is stamped by the server from the verified session, never
 *           sent by a client; a person with two tabs is two peers with the same principal. It carries public ids
 *           only: a name or avatar is looked up by the UI through its own authorised queries.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 2: presence and cursors); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";

import type { CollaborationCursor } from "#contracts/types/collaboration-cursor.type";

/** Another connection in the room. */
export interface PresencePeer {
  /** The connection's id, unique in the room. */
  readonly peerId: string;

  /** The principal behind the connection (`usr_…`). */
  readonly principalId: PublicId;

  /** Where its pointer is, or `null` when it is off the surface. */
  readonly cursor: CollaborationCursor | null;
}
