/**
 * Stackra file contract:
 * Purpose: unit tests of `LoyaltyKitDemoSeeder`: a seeder whose declared ids are one principal per tier, and whose run
 *          creates one account per tier, lowest first, at that tier.
 * Boundary: test only; the account factory's `create` is replaced by a recording spy, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0190 (profiles).
 */
import { Seeder } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LoyaltyAccountFactory } from "#node/database/factories/loyalty-account.factory";
import { LoyaltyKitDemoSeeder } from "#node/database/seeders/demo.seeder";

describe("LoyaltyKitDemoSeeder", () => {
  it("declares one public id per tier", () => {
    expect(new LoyaltyKitDemoSeeder()).toBeInstanceOf(Seeder);
    expect(Object.keys(LoyaltyKitDemoSeeder.ids)).toEqual(["bronze", "silver", "gold"]);
    for (const id of Object.values(LoyaltyKitDemoSeeder.ids))
      expect(id).toMatch(/^usr_[0-9a-z]{26}$/);
  });

  it("creates one account per tier, lowest first", async () => {
    const create = vi
      .spyOn(LoyaltyAccountFactory.prototype, "create")
      .mockImplementation(async () => ({}) as never);

    await new LoyaltyKitDemoSeeder().run();

    expect(create.mock.calls.map(([overrides]) => overrides)).toEqual([
      { memberId: LoyaltyKitDemoSeeder.ids.bronze, tier: LoyaltyTier.Bronze },
      { memberId: LoyaltyKitDemoSeeder.ids.silver, tier: LoyaltyTier.Silver },
      { memberId: LoyaltyKitDemoSeeder.ids.gold, tier: LoyaltyTier.Gold },
    ]);
    create.mockRestore();
  });
});
