/**
 * Stackra file contract:
 * Purpose: unit tests of `AddRunAutomationAndCancelMigration`: it adds the nullable `automation_id` to `workflow.runs`
 *          with its partial index, and widens the status check to `cancelled`.
 *          Its squawk ignores leave the checksum as it was (STA-2612).
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0152 (decision 4); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

/** A lint comment line, which the runner leaves out of a migration's checksum. */
const LINT_LINE = /^-- (?:squawk-ignore|lint:)[^\n]*\n/gm;

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

  it("carries its squawk ignores, and hashes as before without the lint lines (STA-2612)", () => {
    const swap = compileMigration(AddRunAutomationAndCancelMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .find((statement) => statement.includes('drop constraint "ck_runs_status"'));
    expect(swap).toContain("-- squawk-ignore ban-drop-constraint, constraint-missing-not-valid\n");
    expect(swap?.replaceAll(LINT_LINE, "")).toBe(
      'alter table "workflow"."runs" drop constraint "ck_runs_status", add constraint "ck_runs_status" check ' +
        "(\"status\" in ('running', 'waiting', 'completed', 'compensating', 'compensated', 'failed', 'cancelled'))",
    );
  });
});
