/**
 * Stackra file contract:
 * Purpose: unit tests of `BalanceView`: a registered shape built with `create`, which refuses a negative balance and an
 *          unknown tier.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328.
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema } from "@stackra/validation";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { BalanceView } from "#core/schemas/balance-view.schema";

describe("BalanceView", () => {
  it("holds the balance, tier and next expiry", () => {
    const view = BalanceView.create({
      memberId: "usr_1",
      tier: LoyaltyTier.Gold,
      balance: 1000,
      nextExpiryAt: null,
    });
    expect(view).toBeInstanceOf(Schema);
    expect(view.balance).toBe(1000);
    expect(view.nextExpiryAt).toBeNull();
  });

  it("refuses a negative balance and an unknown tier", () => {
    const base = { memberId: "usr_1", tier: LoyaltyTier.Bronze, balance: 0, nextExpiryAt: null };
    expect(() => BalanceView.create({ ...base, balance: -1 })).toThrow();
    expect(() => BalanceView.create({ ...base, tier: "platinum" as LoyaltyTier })).toThrow();
  });
});
