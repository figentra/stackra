/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyMembers`: an abstract port the host implements, asked whether a member may redeem.
 * Boundary: test only; a minimal host driver stands in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0260 (decision 9).
 */
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyMembers } from "#contracts/ports/loyalty-members.port";
import type { MemberId } from "#contracts/types/member-id.type";

/** A host answer: only `usr_1` is a member. */
class OneMember extends LoyaltyMembers {
  async isMember(principalId: MemberId): Promise<boolean> {
    return principalId === "usr_1";
  }
}

describe("LoyaltyMembers", () => {
  it("is an abstract port the host answers", async () => {
    const members = new OneMember();
    expect(members).toBeInstanceOf(Port);
    expect(await members.isMember("usr_1" as MemberId)).toBe(true);
    expect(await members.isMember("usr_2" as MemberId)).toBe(false);
  });
});
