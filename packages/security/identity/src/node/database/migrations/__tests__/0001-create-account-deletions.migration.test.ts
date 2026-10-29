/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateAccountDeletionsMigration`: one transactional step that creates
 *          `identity.account_deletions` keyed by erasure id, under the forced generated policy on the session's tenant
 *          (null for no tenant), with one live deletion per subject per partition.
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0239; STA-1567.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateAccountDeletionsMigration } from "#node/database/migrations/0001-create-account-deletions.migration";

describe("CreateAccountDeletionsMigration", () => {
  const { steps } = compileMigration(CreateAccountDeletionsMigration, { schema: "identity" });
  const sql = steps.flatMap((step) => step.sql).join("\n");

  it("is one transactional step", () => {
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
  });

  it("creates the table keyed by erasure id, one deletion per subject per partition", () => {
    expect(sql).toContain('create table "identity"."account_deletions"');
    expect(sql).toContain('primary key ("erasure_id")');
    expect(sql).toContain("((coalesce(scope_id, '-')), subject)");
  });

  it("forces the tenant policy, a null scope for a session in no tenant", () => {
    expect(sql).toContain('alter table "identity"."account_deletions" force row level security');
    expect(sql).toContain(
      `"scope_id" is not distinct from nullif(current_setting('app.tenant_id', true), '')`,
    );
  });
});
