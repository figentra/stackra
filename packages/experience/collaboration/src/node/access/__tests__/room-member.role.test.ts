/**
 * Stackra file contract:
 * Purpose: unit tests of `RoomMemberRole`: it is a role granting the room token and publish permissions.
 * Boundary: test only; reads the recorded kind options.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0208 (decision 2).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { RoomMemberRole } from "#node/access/room-member.role";
import { RoomPermissions } from "#node/access/room.permissions";

describe("RoomMemberRole", () => {
  it("grants the room token and publish permissions", () => {
    expect(kindOf(RoomMemberRole)?.kind).toBe("role");
    expect(kindOf(RoomMemberRole)?.options["grants"]).toEqual([
      RoomPermissions.token,
      RoomPermissions.publish,
    ]);
  });
});
