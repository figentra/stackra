/**
 * Stackra file contract:
 * Purpose: unit tests of `RoomController`: it is a raw controller at `REALTIME_ROOM_PATH` and answers a GET with the
 *          room hub's event stream.
 * Boundary: test only; a stand-in room hub records the request.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 1 and 5).
 */
import { kindOf } from "@stackra/container";
import { REALTIME_ROOM_PATH, type RealtimeRooms } from "@stackra/realtime";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { RoomController } from "#node/raw/room.controller";

describe(RoomController, () => {
  it("serves the room path with the hub's stream", async () => {
    expect(kindOf(RoomController)?.kind).toBe("controller");
    expect(kindOf(RoomController)?.options).toEqual({ path: REALTIME_ROOM_PATH });
    const answer = new Response("stream");
    const stream = vi.fn(() => answer);
    const controller = new RoomController({ stream } as unknown as RealtimeRooms);
    const request = new Request(`https://api.example.test${REALTIME_ROOM_PATH}?token=t1`);
    expect(await controller.handle(request)).toBe(answer);
    expect(stream).toHaveBeenCalledWith(request);
  });
});
