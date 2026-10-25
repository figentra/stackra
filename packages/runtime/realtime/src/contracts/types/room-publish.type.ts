/**
 * Stackra file contract:
 * Purpose: `RoomPublish`, the one frame a member sends to its room: a message kind and its data.
 * Boundary: a type only, in the leaf entry; JSON on the socket. It names no sender: the server stamps the sender from
 *           the session and drops anything a client claims (ADR 0346 decision 4). The data is the collaboration
 *           package's typed payload; the server relays it without reading it.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 4 and 5).
 */
import type { RoomMessageKind } from "#contracts/types/room-message-kind.type";

/** A message from a member. */
export interface RoomPublish {
  /** The kind. */
  readonly t: RoomMessageKind;

  /** The payload. */
  readonly data: unknown;
}
