/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyMembersFake`: a `LoyaltyMembers` that answers from its ids and records every question.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0266 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyMembers } from "#contracts/ports/loyalty-members.port";
import { memberId } from "#core/functions/member-id.function";
import { LoyaltyMembersFake } from "#testing/loyalty-members.fake";

describe("LoyaltyMembersFake", () => {
  it("answers from its ids and records every question", async () => {
    const members = LoyaltyMembersFake.with(["usr_1"]);

    expect(members).toBeInstanceOf(LoyaltyMembers);
    expect(await members.isMember(memberId("usr_1"))).toBe(true);
    expect(await members.isMember(memberId("usr_2"))).toBe(false);
    expect(members.calls("isMember")).toEqual(["usr_1", "usr_2"]);
  });
});
