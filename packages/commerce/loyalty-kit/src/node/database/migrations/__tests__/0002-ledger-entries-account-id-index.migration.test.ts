/**
 * Stackra file contract:
 * Purpose: unit tests of `LedgerEntriesAccountIdIndexMigration`: one non-transactional step that builds
 *          `idx_ledger_entries_account_id` concurrently, with its concurrent inverse.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended: online operations in their own step).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { LedgerEntriesAccountIdIndexMigration } from "#node/database/migrations/0002-ledger-entries-account-id-index.migration";

describe("LedgerEntriesAccountIdIndexMigration", () => {
  it("builds the account index online, in its own step", () => {
    expect(
      compileMigration(LedgerEntriesAccountIdIndexMigration, { schema: "loyalty_kit" }).steps,
    ).toEqual([
      {
        sql: [
          'create index concurrently "idx_ledger_entries_account_id" on "loyalty_kit"."ledger_entries" ("account_id")',
        ],
        transactional: false,
        inverse: [
          'drop index concurrently if exists "loyalty_kit"."idx_ledger_entries_account_id"',
        ],
      },
    ]);
  });
});
