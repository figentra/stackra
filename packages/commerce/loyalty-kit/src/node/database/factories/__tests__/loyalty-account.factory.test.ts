/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyAccountFactory`: an unsaved active bronze account, and the `frozen` and `gold` states.
 * Boundary: test only; `make` builds without a database. The factory is bound to its model as gen binds it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0190 (factories with states).
 */
import { registerModelPartners } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyAccountFactory } from "#node/database/factories/loyalty-account.factory";
import { LoyaltyAccount } from "#node/models/loyalty-account.model";

registerModelPartners([[LoyaltyAccountFactory, LoyaltyAccount]]);

describe("LoyaltyAccountFactory", () => {
  it("builds an active bronze account for a fresh principal", () => {
    const account = LoyaltyAccountFactory.new().make();
    expect(account).toBeInstanceOf(LoyaltyAccount);
    expect(account.memberId).toMatch(/^usr_/);
    expect(account.tier).toBe(LoyaltyTier.Bronze);
    expect(account.canTransact).toBe(true);
  });

  it("freezes for review and lifts to gold", () => {
    const frozen = LoyaltyAccountFactory.new().frozen().make();
    expect(frozen.isFrozen).toBe(true);
    expect(frozen.frozenAt).toBeInstanceOf(Date);
    expect(frozen.notes).toEqual({ reason: "review" });
    expect(LoyaltyAccountFactory.new().gold().make().tier).toBe(LoyaltyTier.Gold);
  });

  it("lets overrides win", () => {
    expect(LoyaltyAccountFactory.new().make({ memberId: "usr_1" }).memberId).toBe("usr_1");
  });
});
