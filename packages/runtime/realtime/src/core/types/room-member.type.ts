/**
 * Stackra file contract:
 * Purpose: `RoomMember`, a joined connection as its owner drives it: its stamped identity, `publish` to relay a message
 *          to the room, and `leave`.
 * Boundary: a type only. `publish` throws the refusal of a message the room will not relay (`forbidden`,
 *           `room_limit_reached`); `leave` is idempotent.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 4 to 6).
 */
import type { RoomPeerRef } from "#contracts/types/room-peer-ref.type";
import type { RoomPublish } from "#contracts/types/room-publish.type";

/** A joined room connection. */
export interface RoomMember {
  /** Who the room sees: the server-minted peer id and the session's principal. */
  readonly self: RoomPeerRef;

  /**
   * Relays `message` to the room's other members.
   *
   * @throws ForbiddenError for a viewer's `update`; RoomLimitReachedError over the size or rate cap (the member is
   *         dropped).
   */
  publish(message: RoomPublish): void;

  /** Leaves the room. */
  leave(): void;
}
