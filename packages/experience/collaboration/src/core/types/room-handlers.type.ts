/**
 * Stackra file contract:
 * Purpose: `RoomHandlers`, what `openRoom` reports to a collaboration driver: the room accepted this connection (with
 *          its stamped identity), a frame from the room, or the connection went down (it reconnects by itself).
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 4 and 5).
 */
import type { RoomFrame, RoomPeerRef } from "@stackra/realtime/contracts";

/** The callbacks of one room connection. */
export interface RoomHandlers {
  /** The room accepted the connection; `self` is the identity the others see. */
  onWelcome(self: RoomPeerRef): void;

  /** A frame from the room after the welcome. */
  onFrame(frame: RoomFrame): void;

  /** A welcomed connection went down; another attempt follows unless the caller closed it. */
  onDown(): void;
}
