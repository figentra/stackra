/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateRunsMigration`: one transactional step that creates the `workflow` schema, the `ltree`
 *          extension and the three journal tables with their keys, status checks, the step-to-run foreign key, every
 *          column commented, the nullable scope columns, the lookup indexes and no row-level-security policy.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0102 (decision 1).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateRunsMigration } from "#node/database/migrations/0001-create-runs.migration";

describe("CreateRunsMigration", () => {
  const { after, steps } = compileMigration(CreateRunsMigration, {
    schema: "workflow",
    createsSchema: true,
  });
  const [step] = steps;
  const statements = step?.sql ?? [];
  const sql = statements.join("\n");

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the schema, the ltree extension and the three tables", () => {
    expect(statements[0]).toBe('create schema if not exists "workflow"');
    expect(sql).toContain('create extension if not exists "ltree"');
    for (const table of ["runs", "steps", "signals"])
      expect(sql).toContain(`create table "workflow"."${table}" (`);
  });

  it("checks the statuses against the enums' codes", () => {
    expect(sql).toContain(
      `constraint "ck_runs_status" check ("status" in ('running', 'waiting', 'completed', 'compensating', 'compensated', 'failed'))`,
    );
    expect(sql).toContain(
      `constraint "ck_steps_status" check ("status" in ('running', 'waiting', 'done', 'skipped', 'failed', 'timed_out', 'compensated'))`,
    );
  });

  it("ties each step to its run and keys it by run and name", () => {
    expect(sql).toContain('"fk_steps_run_id"');
    expect(sql).toContain("on delete cascade");
    expect(sql).toContain('primary key ("run_id", "name")');
  });

  it("comments every column", () => {
    const columns: Record<string, readonly string[]> = {
      runs: [
        "workflow",
        "status",
        "input",
        "origin",
        "error",
        "scope_id",
        "scope_path",
        "started_at",
      ],
      steps: ["run_id", "name", "position", "status", "attempts", "result", "progress", "wake_at"],
      signals: ["signal", "correlation", "payload", "scope_id", "received_at", "expires_at"],
    };
    for (const [table, names] of Object.entries(columns))
      for (const column of names)
        expect(
          statements.some((statement) =>
            statement.startsWith(`comment on column "workflow"."${table}"."${column}"`),
          ),
        ).toBe(true);
  });

  it("indexes the engine's lookups and sets no row-level security", () => {
    expect(sql).toContain('"idx_runs_workflow_started_at"');
    expect(sql).toContain("where status in ('running', 'waiting', 'compensating')");
    expect(sql).toContain('"idx_signals_signal_correlation_received_at"');
    expect(sql).not.toContain("row level security");
  });
});
