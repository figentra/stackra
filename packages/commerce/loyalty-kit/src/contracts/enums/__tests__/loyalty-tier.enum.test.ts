/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyTier`: the tiers in rank order, each with its earn multiplier in hundredths.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";

describe("LoyaltyTier", () => {
  it("lists the tiers lowest first", () => {
    expect(Enum.values(LoyaltyTier)).toEqual(["bronze", "silver", "gold"]);
  });

  it("carries the multiplier the tier extension applies", () => {
    expect(Enum.values(LoyaltyTier).map((tier) => Enum.meta(LoyaltyTier, tier).multiplier)).toEqual(
      [100, 150, 200],
    );
  });
});
