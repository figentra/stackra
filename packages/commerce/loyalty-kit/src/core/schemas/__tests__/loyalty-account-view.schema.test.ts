/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyAccountView`: a registered shape built with `create`, which refuses an account id that
 *          is not a `lac_` public id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0328; ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyAccountView } from "#core/schemas/loyalty-account-view.schema";

/** A minted-looking account id. */
const ACCOUNT_ID = "lac_01ja0000000000000000000011" as PublicId<"lac">;

describe("LoyaltyAccountView", () => {
  const values = {
    accountId: ACCOUNT_ID,
    memberId: "usr_1",
    tier: LoyaltyTier.Silver,
    isFrozen: false,
    frozenAt: null,
    createdAt: new Date("2026-10-21T00:00:00Z"),
  };

  it("holds the row of the account list", () => {
    const view = LoyaltyAccountView.create(values);
    expect(view.accountId).toBe(ACCOUNT_ID);
    expect(view.tier).toBe(LoyaltyTier.Silver);
  });

  it("refuses an account id of another prefix", () => {
    expect(() =>
      LoyaltyAccountView.create({ ...values, accountId: "usr_1" as PublicId<"lac"> }),
    ).toThrow();
  });
});
