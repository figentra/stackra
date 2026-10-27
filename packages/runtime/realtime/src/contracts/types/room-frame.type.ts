/**
 * Stackra file contract:
 * Purpose: `RoomFrame`, a frame a member receives from its room: `welcome` with its own stamped identity and its publish
 *          key once joined, `left` when another member leaves, a relayed message with its stamped sender, or `refused`
 *          with the code of a message the server would not relay.
 * Boundary: a type only, in the leaf entry; JSON on the socket or the event stream. A relayed message's `from` is always
 *           the server's stamp. `refused` carries a refusal code only (`forbidden` for a viewer's update), never the
 *           message. The welcome's `key` is a secret of this membership alone: a member on the server-sent-events
 *           fallback sends it with `collaboration.room.publish` (ADR 0346 decision 5); it is never relayed.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 3 to 6).
 */
import type { RoomMessageKind } from "#contracts/types/room-message-kind.type";
import type { RoomPeerRef } from "#contracts/types/room-peer-ref.type";

/** A frame from the room. */
export type RoomFrame =
  | { readonly t: "welcome"; readonly self: RoomPeerRef; readonly key: string }
  | { readonly t: "left"; readonly peer: RoomPeerRef }
  | { readonly t: "refused"; readonly code: string }
  | { readonly t: RoomMessageKind; readonly from: RoomPeerRef; readonly data: unknown };
