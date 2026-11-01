/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateConnectedAccountLimitsMigration`: one transactional step that creates the live limits
 *          (one per connection per partition) and their change history, both under the forced tenant policy.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0239; STA-1707.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateConnectedAccountLimitsMigration } from "#node/database/migrations/0002-create-connected-account-limits.migration";

describe("CreateConnectedAccountLimitsMigration", () => {
  const { steps } = compileMigration(CreateConnectedAccountLimitsMigration, { schema: "payments" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the live limits, one per connection per partition, and their history", () => {
    expect(sql).toContain('create table "payments"."connected_account_limits"');
    expect(sql).toContain('create table "payments"."connected_account_limit_changes"');
    expect(sql).toContain('"cap_minor" bigint');
    expect(sql).toContain("((coalesce(scope_id, '-')), connection_id)");
  });

  it("forces the tenant policy on both tables", () => {
    for (const table of ["connected_account_limits", "connected_account_limit_changes"])
      expect(sql).toContain(`alter table "payments"."${table}" force row level security`);
  });
});
