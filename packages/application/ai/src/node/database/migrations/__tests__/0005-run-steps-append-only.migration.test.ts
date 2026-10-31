/**
 * Stackra file contract:
 * Purpose: unit tests of `RunStepsAppendOnlyMigration`: it renames `ai.steps` and `ai.approvals` to the names their
 *          models derive, revokes `UPDATE` on `ai.run_steps` only, and states the renames and the grant back as inverses.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); STA-1413; STA-1689.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { RunStepsAppendOnlyMigration } from "#node/database/migrations/0005-run-steps-append-only.migration";

describe("RunStepsAppendOnlyMigration", () => {
  const { steps } = compileMigration(RunStepsAppendOnlyMigration, { schema: "ai" });
  const sql = steps.flatMap((step) => step.sql);
  const inverse = steps.flatMap((step) => (step.inverse === false ? [] : step.inverse));

  it("renames the tables, then revokes update on run_steps only", () => {
    expect(sql).toEqual([
      'alter table "ai"."steps" rename to "run_steps"',
      'alter table "ai"."approvals" rename to "run_approvals"',
      'revoke update on "ai"."run_steps" from public, current_user',
    ]);
  });

  it("states the renames and the grant back as inverses", () => {
    expect(inverse).toContain('alter table "ai"."run_steps" rename to "steps"');
    expect(inverse).toContain('alter table "ai"."run_approvals" rename to "approvals"');
    expect(inverse).toContain('grant update on "ai"."run_steps" to current_user');
  });
});
