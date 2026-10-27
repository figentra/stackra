/**
 * Stackra file contract:
 * Purpose: `FanoutMessage`, what one instance of a service hands the others through the `RealtimeFanout`: a broadcast
 *          to deliver to their sessions, a room frame to deliver to their members of that room, an instance's member
 *          count of a room (for the cross-instance member cap), or a member's publish that arrived through the
 *          `collaboration.room.publish` action on an instance that does not hold the member.
 * Boundary: a type only, in the leaf entry; JSON on the wire. A room frame names the instance it came from, so that
 *           instance does not deliver it twice, and carries that instance's member count of the room. A `room-publish`
 *           names the member by its publish key and the action's verified principal; only the instance holding that
 *           member acts on it, with the same checks as a socket message. The broadcast stays data-free (ADR 0225).
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: Valkey or Postgres pub/sub fan-out); ADR 0346 (decisions 5 and 6).
 */
import type { RealtimeBroadcast } from "#contracts/types/realtime-broadcast.type";
import type { RoomFrame } from "#contracts/types/room-frame.type";
import type { RoomPublish } from "#contracts/types/room-publish.type";

/** A message between instances. */
export type FanoutMessage =
  | { readonly kind: "broadcast"; readonly broadcast: RealtimeBroadcast }
  | {
      readonly kind: "room";
      /** The room key, `<scope>:<document>`. */
      readonly room: string;
      readonly frame: RoomFrame;
      /** The id of the instance that relayed it first. */
      readonly origin: string;
      /** The origin's member count of the room after the frame. */
      readonly members?: number;
    }
  | {
      readonly kind: "room-members";
      /** The room key, `<scope>:<document>`. */
      readonly room: string;
      /** The id of the instance that counted. */
      readonly origin: string;
      /** Its member count of the room. */
      readonly members: number;
    }
  | {
      readonly kind: "room-publish";
      /** The publish key from the member's `welcome`. */
      readonly key: string;
      /** The verified caller of the action; must be the member's principal. */
      readonly principalId: string;
      readonly message: RoomPublish;
    };
