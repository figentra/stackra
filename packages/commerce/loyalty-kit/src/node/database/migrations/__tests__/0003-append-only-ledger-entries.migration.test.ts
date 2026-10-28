/**
 * Stackra file contract:
 * Purpose: unit tests of `AppendOnlyLedgerEntriesMigration`: one revoke of `UPDATE` on `loyalty_kit.ledger_entries`
 *          from `public` and the migrating role, with the grant back as the inverse.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); STA-1413.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AppendOnlyLedgerEntriesMigration } from "#node/database/migrations/0003-append-only-ledger-entries.migration";

describe("AppendOnlyLedgerEntriesMigration", () => {
  const { steps } = compileMigration(AppendOnlyLedgerEntriesMigration, { schema: "loyalty_kit" });

  it("revokes update on the ledger entries, in the transaction", () => {
    expect(steps.flatMap((step) => step.sql)).toEqual([
      'revoke update on "loyalty_kit"."ledger_entries" from public, current_user',
    ]);
    expect(steps.every((step) => step.transactional)).toBe(true);
  });

  it("grants update back as the inverse", () => {
    expect(steps.flatMap((step) => step.inverse)).toContain(
      'grant update on "loyalty_kit"."ledger_entries" to current_user',
    );
  });
});
