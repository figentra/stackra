/**
 * Stackra file contract:
 * Purpose: unit tests of `EnrollMemberInput`: a registered shape whose tier defaults to bronze, which refuses an empty
 *          principal and an account id of another prefix.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { EnrollMemberInput } from "#node/schemas/enroll-member-input.schema";

const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;

describe("EnrollMemberInput", () => {
  it("defaults the tier to bronze", () => {
    const input = EnrollMemberInput.create({
      accountId,
      principalId: "usr_1",
    } as EnrollMemberInput);
    expect(input.tier).toBe(LoyaltyTier.Bronze);
  });

  it("refuses an empty principal and another prefix", () => {
    expect(() =>
      EnrollMemberInput.create({ accountId, principalId: "", tier: LoyaltyTier.Bronze }),
    ).toThrow();
    expect(() =>
      EnrollMemberInput.create({
        accountId: "usr_1" as PublicId<"lac">,
        principalId: "usr_1",
        tier: LoyaltyTier.Bronze,
      }),
    ).toThrow();
  });
});
