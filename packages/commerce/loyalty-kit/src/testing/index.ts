/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/loyalty-kit (the members fake, the points fixture, the
 *          balance matcher, both model factories and the `demo` seeder with its ids) until `stackra gen` writes the
 *          entry barrels (STA-339).
 * Boundary: test and seed helpers only; no runtime entry imports this one, so a production server never loads Faker.
 *           The factories and the seeder live in `src/node/database/` and are exported from here only. Needs the
 *           optional peer @stackra/testing.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269; the STA-347 stand-in barrel decision.
 */
export { LedgerEntryFactory } from "#node/database/factories/ledger-entry.factory";
export { LoyaltyAccountFactory } from "#node/database/factories/loyalty-account.factory";
export { LoyaltyKitDemoSeeder } from "#node/database/seeders/demo.seeder";
export { LoyaltyMembersFake } from "#testing/loyalty-members.fake";
export { pointsEntry } from "#testing/points-entry.fixture";
export { toHaveBalance } from "#testing/to-have-balance.matcher";
