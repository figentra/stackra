/**
 * Stackra file contract:
 * Purpose: unit test of `REALTIME_ROOM_PATH`: the room socket path sits under the realtime path.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { REALTIME_PATH } from "#core/constants/realtime-path.constant";
import { REALTIME_ROOM_PATH } from "#core/constants/realtime-room-path.constant";

describe("REALTIME_ROOM_PATH", () => {
  it("is the room path under the realtime path", () => {
    expect(REALTIME_ROOM_PATH).toBe(`${REALTIME_PATH}/room`);
  });
});
