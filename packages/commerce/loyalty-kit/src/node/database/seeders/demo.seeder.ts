/**
 * Stackra file contract:
 * Purpose: `LoyaltyKitDemoSeeder`, the kit's part of the `demo` profile: three accounts, one per tier, with one
 *          1 000-point earn each.
 * Boundary: the profile is the file name and the key is `loyalty_kit.demo`. Synthetic rows from the kit's factories, so
 *           the seeder is exported from ./testing only and Faker never reaches a runtime entry. The principal ids are
 *           declared once, in `ids`, and every member that names them imports them from here. The entries are dated
 *           now (the frozen clock in tests), so the balance query has an expiry to show.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 13, 15 and 20); ADR 0190 (profiles minimal, demo and test); ADR 0269.
 */
import { Enum } from "@stackra/contracts";
import { Seeder } from "@stackra/database";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import { LedgerEntryFactory } from "#node/database/factories/ledger-entry.factory";
import { LoyaltyAccountFactory } from "#node/database/factories/loyalty-account.factory";

/**
 * `stackra db seed --profile demo`; in tests `.seed(LoyaltyKitDemoSeeder)`.
 *
 * @example
 * const app = await createTestingModule(LoyaltyKitModule).seed(LoyaltyKitDemoSeeder).compile();
 */
export class LoyaltyKitDemoSeeder extends Seeder {
  /** The only place these principal ids are typed, one member per tier. */
  static readonly ids = {
    bronze: "usr_01ja0000000000000000000001",
    silver: "usr_01ja0000000000000000000002",
    gold: "usr_01ja0000000000000000000003",
  } as const;

  /** One account per tier, each holding one 1 000-point earn. */
  async run(): Promise<void> {
    for (const tier of Enum.values(LoyaltyTier)) {
      const memberId = LoyaltyKitDemoSeeder.ids[tier];
      const earn = LedgerEntryFactory.new().state({
        memberId,
        points: 1000,
        reference: `seed_${tier}`,
        at: new Date(),
      });
      // oxlint-disable-next-line no-await-in-loop -- one account per tier, in rank order
      await LoyaltyAccountFactory.new().has(earn).create({ memberId, tier });
    }
  }
}
