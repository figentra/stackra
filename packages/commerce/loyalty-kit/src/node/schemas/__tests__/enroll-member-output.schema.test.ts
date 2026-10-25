/**
 * Stackra file contract:
 * Purpose: unit tests of `EnrollMemberOutput`: a registered shape of the account id and its tier.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { EnrollMemberOutput } from "#node/schemas/enroll-member-output.schema";

describe("EnrollMemberOutput", () => {
  it("holds the account and its tier", () => {
    const accountId = "lac_01ja0000000000000000000011" as PublicId<"lac">;
    expect({ ...EnrollMemberOutput.create({ accountId, tier: LoyaltyTier.Gold }) }).toEqual({
      accountId,
      tier: LoyaltyTier.Gold,
    });
  });
});
