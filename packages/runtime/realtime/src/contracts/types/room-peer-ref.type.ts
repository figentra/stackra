/**
 * Stackra file contract:
 * Purpose: `RoomPeerRef`, a room member as other members see it: the connection's server-minted peer id and the
 *          principal behind it.
 * Boundary: a type only, in the leaf entry. Both ids are stamped by the server from the session; a client never names
 *           its own (ADR 0346 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 3 and 4).
 */

/** One member of a room. */
export interface RoomPeerRef {
  /** The connection's id, unique in the room, minted by the server. */
  readonly peerId: string;

  /** The principal behind the connection (`usr_…`). */
  readonly principalId: string;
}
