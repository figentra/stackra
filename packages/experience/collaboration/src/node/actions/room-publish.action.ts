/**
 * Stackra file contract:
 * Purpose: `RoomPublishAction`, `collaboration.room.publish@1`: the client-to-server leg of a room member on the
 *          server-sent-events fallback (or on any driver without client publish). It relays one message as the member
 *          whose welcome carried the key, through `RealtimeRooms.publishFrom`, with the checks a socket message gets.
 * Boundary: the caller is the action's verified actor (its subject for a delegated call); the key works only for the
 *           member's own principal, so a leaked key is useless to anyone else. The view permission, visibility and
 *           entitlement were checked when the room token was issued, and the room re-checks the edit right, the size
 *           and the rate caps here (ADR 0346 decisions 3 and 6). A member on another instance is reached through the
 *           fanout, where a refusal goes back to the member as a `refused` frame. Not an MCP tool.
 * Runtime: node
 * Governing contract: ADR 0346 (decision 5); ADR 0294 (decisions 2, 3, 16 and 21); ADR 0305 (rule 28); ADR 0098.
 */
import { Action, type ActionContext } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";
import type { RealtimeRooms } from "@stackra/realtime";

import type { RoomPublishInput } from "#node/schemas/room-publish-input.schema";

/**
 * Publishes to a room as one of its members.
 *
 * @example
 * await client.collaboration.room.publish({ key, t: "awareness", data: { cursor: 4 } });
 */
export class RoomPublishAction extends Action({
  key: "room.publish",
  actors: [ActorKind.User],
  // reason: a room message is a live editor's, not something an agent sends as a tool call
  tool: false,
}) {
  /** The room hub that holds, or fans out to, the member. */
  private readonly rooms: RealtimeRooms;

  /**
   * @param rooms - the room hub of this instance.
   */
  constructor(rooms: RealtimeRooms) {
    super();
    this.rooms = rooms;
  }

  /**
   * Relays the message as the member whose key it is.
   *
   * @throws ForbiddenError when the member belongs to another principal or is a viewer sending an update;
   *         RoomLimitReachedError over the size or rate cap.
   */
  async handle(input: RoomPublishInput, ctx: ActionContext): Promise<void> {
    const subject = ctx.actor.onBehalfOf ?? ctx.actor;
    await this.rooms.publishFrom(input.key, subject.id, { t: input.t, data: input.data });
  }
}
