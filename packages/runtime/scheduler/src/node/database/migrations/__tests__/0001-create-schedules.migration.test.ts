/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateSchedulesMigration`: one transactional step that creates the `ltree` extension, the
 *          schedule table with its scope columns, path index and misfire check, and the watermark table keyed by its
 *          key; every column commented, no row-level-security policy.
 * Boundary: test only; compiles the migration to SQL without a database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0159 (as amended); ADR 0148 (decision 5); R-16.
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateSchedulesMigration } from "#node/database/migrations/0001-create-schedules.migration";

describe("CreateSchedulesMigration", () => {
  const { after, steps } = compileMigration(CreateSchedulesMigration, {
    schema: "scheduler",
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

  it("creates the extension and the schedule table with its columns and misfire check", () => {
    expect(sql).toContain("ltree");
    expect(sql).toContain('create table "scheduler"."schedules"');
    expect(sql).toContain('"id" varchar(33) not null');
    expect(sql).toContain('"scope_id" varchar(33) not null');
    expect(sql).toContain('"scope_path" ltree not null');
    expect(sql).toContain('"job_key" varchar(200) not null');
    expect(sql).toContain('"input" jsonb');
    expect(sql).toContain(
      `constraint "ck_schedules_misfire" check ("misfire" in ('catch_up', 'once', 'skip'))`,
    );
    expect(sql).toContain('using gist ("scope_path")');
  });

  it("creates the watermark table keyed by its key", () => {
    expect(sql).toContain('create table "scheduler"."watermarks"');
    expect(sql).toContain('"ticked_at" timestamptz not null');
    expect(sql).toMatch(/primary key \("schedule_key"\)/);
  });

  it("comments every column it writes and adds no policy", () => {
    for (const [table, column] of [
      ["schedules", "scope_id"],
      ["schedules", "scope_path"],
      ["schedules", "job_key"],
      ["schedules", "cron"],
      ["schedules", "time_zone"],
      ["schedules", "input"],
      ["schedules", "misfire"],
      ["watermarks", "schedule_key"],
      ["watermarks", "ticked_at"],
    ])
      expect(
        statements.some((statement) =>
          statement.startsWith(`comment on column "scheduler"."${table}"."${column}"`),
        ),
      ).toBe(true);
    expect(sql).not.toContain("row level security");
  });
});
