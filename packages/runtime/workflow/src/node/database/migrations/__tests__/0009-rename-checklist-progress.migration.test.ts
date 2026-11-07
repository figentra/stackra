/**
 * Stackra file contract:
 * Purpose: unit tests of `RenameChecklistProgressMigration`: it renames `workflow.checklist_progress` to the model's
 *          table, `checklist_progresses`, with the inverse rename.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); ADR 0294 (decision 20).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { RenameChecklistProgressMigration } from "#node/database/migrations/0009-rename-checklist-progress.migration";

describe("RenameChecklistProgressMigration", () => {
  it("renames the progress table to the model's name", () => {
    const sql = compileMigration(RenameChecklistProgressMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain(
      'alter table "workflow"."checklist_progress" rename to "checklist_progresses"',
    );
  });
});
