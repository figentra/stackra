/**
 * Stackra file contract:
 * Purpose: unit tests of `RenameRunPoliciesMigration`: it renames the tenant policies of `ai.run_steps` and
 *          `ai.run_approvals` after their tables, in place, and states each rename back as its inverse.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); STA-2577.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { RenameRunPoliciesMigration } from "#node/database/migrations/0006-rename-run-policies.migration";

describe("RenameRunPoliciesMigration", () => {
  const { steps } = compileMigration(RenameRunPoliciesMigration, { schema: "ai" });
  const sql = steps.flatMap((step) => step.sql);
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse));

  it("renames the two policies after their tables", () => {
    expect(sql).toEqual([
      'alter policy "pol_steps_tenant_id" on "ai"."run_steps" rename to "pol_run_steps_tenant_id"',
      'alter policy "pol_approvals_tenant_id" on "ai"."run_approvals" rename to "pol_run_approvals_tenant_id"',
    ]);
  });

  it("states each rename back as its inverse", () => {
    expect(inverse).toContain(
      'alter policy "pol_run_steps_tenant_id" on "ai"."run_steps" rename to "pol_steps_tenant_id"',
    );
    expect(inverse).toContain(
      'alter policy "pol_run_approvals_tenant_id" on "ai"."run_approvals" rename to "pol_approvals_tenant_id"',
    );
  });
});
