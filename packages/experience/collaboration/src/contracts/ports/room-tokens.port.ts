/**
 * Stackra file contract:
 * Purpose: the `RoomTokens` port: how a client's collaboration drivers get a one-time token for a document's room
 *          before each connect (and each reconnect), with the realtime origin to connect to.
 * Boundary: an abstract class that is its own token, keyed `collaboration.RoomTokens`. The host binds a driver over its
 *           generated client's room-token action, whose server side checks the document's view permission at its
 *           scope, the visibility rules and the live-collaboration entitlement before `RealtimeRooms.issueToken`
 *           (ADR 0346 decision 3). A refusal rejects, and the driver keeps retrying with backoff. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0346 (decisions 3 and 5); ADR 0225 (decision 1); ADR 0294 (decisions 4, 15 and 16).
 */
import { Port } from "@stackra/contracts";
import type { RealtimeTarget } from "@stackra/realtime/contracts";

import type { CollaborationRoom } from "#contracts/types/collaboration-room.type";

/**
 * Issues room tokens.
 *
 * @example
 * export class ClientRoomTokensDriver extends Driver(RoomTokens) {
 *   issue(room: CollaborationRoom): Promise<RealtimeTarget> {
 *     return this.client.collaboration.room.token({ document: room.document });
 *   }
 * }
 */
export abstract class RoomTokens extends Port {
  /** Type-only port key, so `DriverName<RoomTokens>` narrows to this port's drivers. */
  declare readonly "~key": "collaboration.RoomTokens";

  /** A fresh one-time token for `room` and the origin to connect to; rejects when the caller may not join. */
  abstract issue(room: CollaborationRoom): Promise<RealtimeTarget>;
}
