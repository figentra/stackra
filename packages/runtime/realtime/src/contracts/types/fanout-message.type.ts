/**
 * Stackra file contract:
 * Purpose: `FanoutMessage`, what one instance of a service hands the others through the `RealtimeFanout`: a broadcast
 *          to deliver to their sessions, or a room frame to deliver to their members of that room.
 * Boundary: a type only, in the leaf entry; JSON on the wire. A room frame names the instance it came from, so that
 *           instance does not deliver it twice. The broadcast stays data-free (ADR 0225).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: Valkey or Postgres pub/sub fan-out); ADR 0346 (decision 5).
 */
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RoomFrame } from "#contracts/types/room-frame.type";

/** A message between instances. */
export type FanoutMessage =
  | { readonly kind: "broadcast"; readonly broadcast: RealtimeBroadcast }
  | {
      readonly kind: "room";
      /** The room key, `<tenant>:<document>`. */
      readonly room: string;
      readonly frame: RoomFrame;
      /** The id of the instance that relayed it first. */
      readonly origin: string;
    };
