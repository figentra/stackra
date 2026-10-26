/**
 * Stackra file contract:
 * Purpose: unit tests of `AddRunAutomationAndCancelMigration`: it adds the nullable `automation_id` to `workflow.runs`
 *          with its partial index, and widens the status check to `cancelled`.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0152 (decision 4); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddRunAutomationAndCancelMigration } from "#node/database/migrations/0007-add-run-automation-and-cancel.migration";

describe("AddRunAutomationAndCancelMigration", () => {
  it("adds the run's automation, indexed, and the cancelled status", () => {
    const sql = compileMigration(AddRunAutomationAndCancelMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain('"workflow"."runs"');
    expect(sql).toMatch(/"automation_id" varchar\(30\) null/);
    expect(sql).toContain("automation_id is not null");
    expect(sql).toContain("'cancelled'");
  });
});
