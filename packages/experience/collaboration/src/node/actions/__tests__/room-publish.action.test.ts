/**
 * Stackra file contract:
 * Purpose: unit tests of `RoomPublishAction`: the `room.publish` action for users, not a tool, which relays the message
 *          through `RealtimeRooms.publishFrom` as the call's subject (the actor, or whom it acts for).
 * Boundary: test only; the action is called directly with a stand-in room hub and a fake action context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decision 5); ADR 0305 (rule 28).
 */
import { fakeActionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import type { RealtimeRooms } from "@stackra/realtime";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RoomPublishAction } from "#node/actions/room-publish.action";
import { RoomPublishInput } from "#node/schemas/room-publish-input.schema";

describe("RoomPublishAction", () => {
  it("is the room.publish action for users and not a tool", () => {
    expect(kindOf(RoomPublishAction)?.options).toMatchObject({
      key: "room.publish",
      actors: [ActorKind.User],
      tool: false,
    });
  });

  it("publishes as the call's subject", async () => {
    const publishFrom = vi.fn(async () => undefined);
    const action = new RoomPublishAction({ publishFrom } as unknown as RealtimeRooms);
    const user = { kind: ActorKind.User, id: "usr_a" } as unknown as Actor;
    const input = RoomPublishInput.create({ key: "k1", t: "awareness", data: { cursor: 4 } });

    await action.handle(input, fakeActionContext({ actor: user }));
    await action.handle(
      input,
      fakeActionContext({
        actor: { kind: ActorKind.Agent, id: "agt_1", onBehalfOf: user } as unknown as Actor,
      }),
    );

    expect(publishFrom.mock.calls).toEqual([
      ["k1", "usr_a", { t: "awareness", data: { cursor: 4 } }],
      ["k1", "usr_a", { t: "awareness", data: { cursor: 4 } }],
    ]);
  });
});
