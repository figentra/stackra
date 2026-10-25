/**
 * Stackra file contract:
 * Purpose: `LoyaltyAccountFactory`, builds `LoyaltyAccount` rows with named states for tests and seeders; the one owner
 *          of a "typical account".
 * Boundary: bound to `LoyaltyAccount` by the type argument (`Factory<LoyaltyAccount>`); a named state is a method.
 *           Faker comes from @stackra/database/testing, and only the `./testing` entry exports a factory, so Faker never
 *           reaches a runtime entry.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 11, 13 and 15); ADR 0190 (factories with states); ADR 0269.
 */
import { Factory, type Faker } from "@stackra/database/testing";
import type { Attributes } from "@stackra/model";

import { LoyaltyTier } from "#contracts/enums/loyalty-tier.enum";
import type { LoyaltyAccount } from "#node/models/loyalty-account.model";

/**
 * An active bronze account for a fresh principal.
 *
 * @example
 * await LoyaltyAccountFactory.new().frozen().create();
 * LoyaltyAccountFactory.new().make({ memberId: "usr_1" }); // unsaved, for a unit test
 */
export class LoyaltyAccountFactory extends Factory<LoyaltyAccount> {
  /** The default attributes of one account; the model's defaults give the rest. */
  definition(faker: Faker): Attributes<LoyaltyAccount> {
    return { memberId: faker.publicId("usr") };
  }

  /** Frozen for review, recently, with the reason noted. */
  frozen(): this {
    return this.state((faker: Faker) => ({
      isFrozen: true,
      frozenAt: faker.date.recent(),
      notes: { reason: "review" },
    }));
  }

  /** At the top tier. */
  gold(): this {
    return this.state({ tier: LoyaltyTier.Gold });
  }
}
