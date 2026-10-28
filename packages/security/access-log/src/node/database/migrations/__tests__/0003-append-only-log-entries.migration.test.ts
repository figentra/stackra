/**
 * Stackra file contract:
 * Purpose: unit tests of `AppendOnlyLogEntriesMigration`: it revokes `UPDATE` on both log tables from `public` and the
 *          migrating role, with the grant back as the inverse, and changes nothing else.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); STA-1413.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AppendOnlyLogEntriesMigration } from "#node/database/migrations/0003-append-only-log-entries.migration";

describe("AppendOnlyLogEntriesMigration", () => {
  const { steps } = compileMigration(AppendOnlyLogEntriesMigration, { schema: "access_log" });
  const sql = steps.flatMap((step) => step.sql);
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse));

  it("revokes update on both log tables", () => {
    expect(sql).toEqual([
      'revoke update on "access_log"."access_log_entries" from public, current_user',
      'revoke update on "access_log"."audit_log_entries" from public, current_user',
    ]);
  });

  it("grants update back as the inverse", () => {
    expect(inverse).toContain('grant update on "access_log"."access_log_entries" to current_user');
    expect(inverse).toContain('grant update on "access_log"."audit_log_entries" to current_user');
  });
});
