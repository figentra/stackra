/**
 * Stackra file contract:
 * Purpose: unit tests of `TierMultiplierExtension`: an extension at order 100 that doubles for gold, scales silver by
 *          one and a half (floored) and leaves bronze untouched.
 * Boundary: test only; the extension has no dependencies, so it is constructed directly; the context comes from
 *           @stackra/actions/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0265 as amended; ADR 0305 (rules 22 to 25).
 */
import { fakeExtensionContext } from "@stackra/actions/testing";
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { memberId } from "#core/functions/member-id.function";
import { TierMultiplierExtension } from "#node/extensions/tier-multiplier.extension";

/** An earn of 100.00 in a currency the extension does not need to know. */
const draft = { memberId: memberId("usr_1"), amount: { minor: 10_000, currency: "SAR" } };

describe("TierMultiplierExtension", () => {
  it("runs at order 100", () => {
    expect(kindOf(TierMultiplierExtension)?.options).toEqual({ order: 100 });
  });

  it("doubles for gold, scales silver and leaves bronze at the base rate", async () => {
    const extension = new TierMultiplierExtension();
    const ctx = fakeExtensionContext();

    expect(await extension.handle(100, { ...draft, tier: LoyaltyTier.Bronze }, ctx)).toBe(100);
    expect(await extension.handle(101, { ...draft, tier: LoyaltyTier.Silver }, ctx)).toBe(151);
    expect(await extension.handle(100, { ...draft, tier: LoyaltyTier.Gold }, ctx)).toBe(200);
  });
});
