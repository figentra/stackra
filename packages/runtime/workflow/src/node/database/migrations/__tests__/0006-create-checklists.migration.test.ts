/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateChecklistsMigration`: `workflow.checklists`, one per scope and key, and
 *          `workflow.checklist_progress`, one row per checklist, step and owner, both under a scope policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0424 (decisions 1 and 2); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateChecklistsMigration } from "#node/database/migrations/0006-create-checklists.migration";

describe("CreateChecklistsMigration", () => {
  it("creates the checklists and their progress under a scope policy", () => {
    const sql = compileMigration(CreateChecklistsMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain('"workflow"."checklists"');
    expect(sql).toContain('"workflow"."checklist_progress"');
    expect(sql).toContain('"owner_id" varchar(63) not null');
    expect(sql).toMatch(/"customized" boolean default false not null/);
    expect(sql.match(/row level security/gi)?.length).toBeGreaterThanOrEqual(2);
  });
});
