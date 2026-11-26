/**
 * Stackra file contract:
 * Purpose: tests of `AddWorkflowTenancyMigration`: `automations`, `checklists` and `checklist_progresses` each gain a
 *          nullable `tenant_id` defaulting to `app.tenant_id`, indexed online, and no policy changes.
 * Boundary: test only; pure compilation through @stackra/database with the tenancy macro, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0347 (decision 1); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { describe, expect, it } from "@stackra/testing";

import { AddWorkflowTenancyMigration } from "#node/database/migrations/0010-add-workflow-tenancy.migration";

const TABLES = ["automations", "checklists", "checklist_progresses"];

describe("AddWorkflowTenancyMigration", () => {
  const sql = compileMigration(AddWorkflowTenancyMigration, {
    schema: "workflow",
    macros: [BelongsToTenantMacro],
  })
    .steps.flatMap((step) => step.sql)
    .join("\n");

  it("adds a nullable column filled from the call's tenant to each table, indexed online", () => {
    for (const table of TABLES) {
      expect(sql).toContain(
        `alter table "workflow"."${table}" add column "tenant_id" varchar(33) default nullif(current_setting('app.tenant_id', true), '')::varchar(33) null`,
      );
      expect(sql).toContain(
        `create index concurrently "idx_${table}_tenant_id" on "workflow"."${table}"`,
      );
    }
  });

  it("leaves each table's scope-path policy as it is", () => {
    expect(sql).not.toContain("policy");
    expect(sql).not.toContain("row level security");
  });
});
