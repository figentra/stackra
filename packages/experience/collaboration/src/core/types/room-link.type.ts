/**
 * Stackra file contract:
 * Purpose: `RoomLink`, a room connection its owner drives: send one message to the room, and close it for good.
 * Boundary: a type only. `send` drops a message while no connection is up: presence and cursors are resent and a
 *           co-editor sends its full state on every welcome, so nothing is lost for good.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decision 5).
 */
import type { RoomPublish } from "@stackra/realtime/contracts";

/** An open room connection. */
export interface RoomLink {
  /** Sends `message` while connected; drops it otherwise. */
  send: (message: RoomPublish) => void;

  /** Closes the connection and stops reconnecting; safe to call more than once. */
  close: () => void;
}
