/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateJobsMigration`: one transactional step that creates the `queue` schema and the
 *          `queue.jobs` table with every column commented, the status check, the index a reservation scans and the
 *          partial unique index on `unique_key`, needing no other member's migration.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0148 (decisions 1 and 3).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { CreateJobsMigration } from "#node/database/migrations/0001-create-jobs.migration";

describe("CreateJobsMigration", () => {
  const { after, steps } = compileMigration(CreateJobsMigration, {
    schema: "queue",
    createsSchema: true,
  });
  const [step] = steps;
  const sql = step?.sql ?? [];

  it("is one transactional step that needs no other member's migration", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(step?.transactional).toBe(true);
  });

  it("creates the schema, then the job table with its status check", () => {
    expect(sql[0]).toBe('create schema if not exists "queue"');
    expect(sql[1]).toMatch(/^create table "queue"\."jobs" \(/);
    expect(sql[1]).toContain('"attempts" integer default 0 not null');
    expect(sql[1]).toContain(
      `constraint "ck_jobs_status" check ("status" in ('waiting', 'running', 'dead'))`,
    );
  });

  it("comments every column", () => {
    for (const column of [
      "queue",
      "job_key",
      "input",
      "origin",
      "unique_key",
      "lease",
      "last_error",
    ])
      expect(
        sql.some((statement) =>
          statement.startsWith(`comment on column "queue"."jobs"."${column}"`),
        ),
      ).toBe(true);
  });

  it("indexes the reservation scan and holds a unique key only while a job waits or runs", () => {
    expect(sql).toContain(
      'create index "idx_jobs_status_queue_run_at" on "queue"."jobs" ("status", "queue", "run_at")',
    );
    expect(sql).toContain(
      `create unique index "idx_jobs_unique_key" on "queue"."jobs" ("unique_key") where status in ('waiting', 'running')`,
    );
  });
});
