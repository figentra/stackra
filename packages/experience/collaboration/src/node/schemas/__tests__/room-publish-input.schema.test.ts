/**
 * Stackra file contract:
 * Purpose: unit tests of `RoomPublishInput`: a key, a known kind and any data parse; an unknown kind or an empty key is
 *          refused; data defaults to null.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0346 (decisions 4 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { RoomPublishInput } from "#node/schemas/room-publish-input.schema";

describe("RoomPublishInput", () => {
  it("takes a key, a known kind and any data", () => {
    expect({ ...RoomPublishInput.create({ key: "k1", t: "update", data: "AAE=" }) }).toEqual({
      key: "k1",
      t: "update",
      data: "AAE=",
    });
    expect(RoomPublishInput.create({ key: "k1", t: "presence" }).data).toBeNull();
  });

  it("refuses an unknown kind or an empty key", () => {
    expect(() => RoomPublishInput.create({ key: "k1", t: "welcome" as never })).toThrow();
    expect(() => RoomPublishInput.create({ key: "", t: "presence" })).toThrow();
  });
});
