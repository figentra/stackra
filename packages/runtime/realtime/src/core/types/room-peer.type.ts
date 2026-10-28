/**
 * Stackra file contract:
 * Purpose: `RoomPeer`, a room member's connection as `RealtimeRooms` delivers to it: a frame out, or a close with a
 *          code and reason when its token expires, it idles or it is dropped over a cap.
 * Boundary: a type only. A throw from `deliver` drops the member, never the relay.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 5 and 6).
 */
import type { RoomFrame } from "#contracts/types/room-frame.type";

/** A connection that receives room frames. */
export interface RoomPeer {
  /** Sends one frame. */
  deliver: (frame: RoomFrame) => void;

  /** Ends the connection with an application close code and a reason. */
  close: (code: number, reason: string) => void;
}
