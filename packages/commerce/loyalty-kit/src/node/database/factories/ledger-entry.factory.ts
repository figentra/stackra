/**
 * Stackra file contract:
 * Purpose: `LedgerEntryFactory`, builds `LedgerEntry` rows for the seeder and for tests that need stored entries.
 * Boundary: bound to `LedgerEntry` by the type argument (`Factory<LedgerEntry>`). The account is optional during the
 *           expand step, as it is for the rows the journal writes; under `LoyaltyAccountFactory.new().has(...)` the
 *           parent fills it, and the caller passes the account's `memberId`, the denormalised column the unique index
 *           reads. Exported from `./testing` only, so Faker never reaches a runtime entry.
 * Runtime: node
 * Governing contract: ADR 0294 (decisions 11, 13 and 15); ADR 0190 (factories with states); ADR 0269.
 */
import { Factory, type Faker } from "@stackra/database/testing";
import type { Attributes } from "@stackra/model";

import { EntryKind } from "#contracts/enums/entry-kind.enum";
import type { LedgerEntry } from "#node/models/ledger-entry.model";

/**
 * A 100-point earn with a unique order reference, recently.
 *
 * @example
 * await LoyaltyAccountFactory.new().has(LedgerEntryFactory.new().count(3)).create();
 */
export class LedgerEntryFactory extends Factory<LedgerEntry> {
  /** The default attributes of one entry; a test or the seeder overrides what it asserts on. */
  definition(faker: Faker): Attributes<LedgerEntry> {
    return {
      memberId: faker.publicId("usr"),
      points: 100,
      kind: EntryKind.Earn,
      reference: faker.publicId("ord"),
      at: faker.date.recent(),
    };
  }
}
