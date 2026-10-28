/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `./contracts` entry: the three ports and the three enums are its values, and
 *          the entry, earn, quote, redemption rates, points import, tier draft and member-id types keep the shapes hosts code against.
 * Boundary: test only; imports the stand-in barrel through its `#contracts` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import type { Branded } from "@stackra/contracts";
import type { MoneyAmount } from "@stackra/money/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import * as contracts from "#contracts/index";

describe("@stackra/loyalty-kit/contracts", () => {
  it("exports exactly its values", () => {
    expect(Object.keys(contracts).sort()).toEqual([
      "DebitOutcome",
      "EntryKind",
      "LoyaltyLedger",
      "LoyaltyMembers",
      "LoyaltyTier",
      "LoyaltyTierPolicy",
    ]);
  });

  it("keeps the shapes hosts code against", () => {
    expectTypeOf<contracts.MemberId>().toEqualTypeOf<Branded<string, "loyalty_kit.MemberId">>();
    expectTypeOf<contracts.PointsEntry["memberId"]>().toEqualTypeOf<contracts.MemberId>();
    expectTypeOf<contracts.PointsEntry["kind"]>().toEqualTypeOf<contracts.EntryKind>();
    expectTypeOf<contracts.PointsEntry["at"]>().toEqualTypeOf<Date>();
    expectTypeOf<contracts.EarnDraft["tier"]>().toEqualTypeOf<contracts.LoyaltyTier>();
    expectTypeOf<contracts.EarnRequest["reference"]>().toEqualTypeOf<string>();
    expectTypeOf<contracts.TierDraft["current"]>().toEqualTypeOf<contracts.LoyaltyTier>();
    expectTypeOf<contracts.RedemptionQuote>().toEqualTypeOf<{
      readonly points: number;
      readonly amount: MoneyAmount;
    }>();
    expectTypeOf<contracts.EarnRequest["amount"]>().toEqualTypeOf<MoneyAmount>();
    expectTypeOf<contracts.EarnDraft["amount"]>().toEqualTypeOf<MoneyAmount>();
    expectTypeOf<contracts.RedemptionRates>().toEqualTypeOf<{
      readonly pointValueMinor: number;
      readonly maxRedeemPercent: number;
    }>();
    expectTypeOf<contracts.PointsImport["tier"]>().toEqualTypeOf<
      contracts.LoyaltyTier | undefined
    >();
  });
});
