/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateAutomationsMigration`: it creates `workflow.automations` with its public id, scope,
 *          key, publish and dry-run columns, one automation per key and scope, and the forced scope policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0122 (decision 3); ADR 0327 (decision 9); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateAutomationsMigration } from "#node/database/migrations/0003-create-automations.migration";

describe("CreateAutomationsMigration", () => {
  const sql = compileMigration(CreateAutomationsMigration, { schema: "workflow" })
    .steps.flatMap((step) => step.sql)
    .join("\n");

  it("creates the automation table with its columns", () => {
    expect(sql).toContain('create table "workflow"."automations"');
    expect(sql).toContain('"key" varchar(127) not null');
    expect(sql).toContain('"dry_run_revision" integer');
    expect(sql).toContain('"principal" jsonb');
  });

  it("keeps one automation per key and scope, under the forced scope policy", () => {
    expect(sql).toMatch(/create unique index .*"scope_id", "key"/);
    expect(sql).toContain('alter table "workflow"."automations" force row level security');
  });
});
