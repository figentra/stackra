/**
 * Stackra file contract:
 * Purpose: unit tests of `AddAutomationPublisherMigration`: it adds the nullable publisher, pause time and pause
 *          reason to `workflow.automations` and indexes the running automations by trigger.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0423 (decisions 1 and 2); ADR 0159 (as amended).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddAutomationPublisherMigration } from "#node/database/migrations/0004-add-automation-publisher.migration";

describe("AddAutomationPublisherMigration", () => {
  it("adds the publisher and the pause, all nullable", () => {
    const sql = compileMigration(AddAutomationPublisherMigration, { schema: "workflow" })
      .steps.flatMap((step) => step.sql)
      .join("\n");
    expect(sql).toContain('"workflow"."automations"');
    expect(sql).toMatch(/"publisher" jsonb null/);
    expect(sql).toMatch(/"paused_at" timestamptz null/);
    expect(sql).toMatch(/"pause_reason" varchar\(63\) null/);
    expect(sql).toContain("paused_at is null");
  });

  it("replaces 0003's index of the same name, and puts it back on the way down (STA-1689)", () => {
    const steps = compileMigration(AddAutomationPublisherMigration, { schema: "workflow" }).steps;
    const sql = steps.flatMap((step) => step.sql);
    const drop = sql.findIndex((statement) => statement.startsWith("drop index concurrently"));
    const create = sql.findIndex((statement) =>
      statement.startsWith('create index concurrently "idx_automations_trigger"'),
    );
    expect(drop).toBeGreaterThanOrEqual(0);
    expect(drop).toBeLessThan(create);
    expect(steps.flatMap((step) => (step.inverse === false ? [] : step.inverse))).toContain(
      'create index concurrently if not exists "idx_automations_trigger" on "workflow"."automations" ("trigger") where published_revision is not null',
    );
  });
});
