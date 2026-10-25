/**
 * Stackra file contract:
 * Purpose: unit tests of `RoomLimitReachedError`: a retryable RateLimited refusal with code `room_limit_reached` and no
 *          details.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decision 6).
 */
import { ErrorKind, isRefusal } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { RoomLimitReachedError } from "#core/errors/room-limit-reached.error";

describe("RoomLimitReachedError", () => {
  it("is the room_limit_reached refusal", () => {
    const refused = RoomLimitReachedError.create();
    expect(isRefusal(refused, RoomLimitReachedError)).toBe(true);
    expect(refused.kind).toBe(ErrorKind.RateLimited);
    expect(RoomLimitReachedError.envelope()).toEqual({
      code: "room_limit_reached",
      category: "rate_limited",
      retryable: true,
    });
  });
});
