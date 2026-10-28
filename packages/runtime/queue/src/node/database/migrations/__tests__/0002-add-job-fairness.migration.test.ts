/**
 * Stackra file contract:
 * Purpose: unit tests of `AddJobFairnessMigration`: expand-only columns on `queue.jobs` (priority with a default, the
 *          scope cap, throttle, batch and chain), a concurrent index for the per-scope running count, and the
 *          `queue.job_batches` table with every column commented.
 * Boundary: test only; pure compilation through @stackra/database, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0159 (as amended); ADR 0148 (decisions 1 and 2).
 */
import { compileMigration } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";

import { AddJobFairnessMigration } from "#node/database/migrations/0002-add-job-fairness.migration";

describe("AddJobFairnessMigration", () => {
  const { steps } = compileMigration(AddJobFairnessMigration, { schema: "queue" });
  const sql = steps.flatMap((step) => step.sql);

  it("adds the fairness columns to the job table", () => {
    for (const column of ["priority", "scope_concurrency", "throttle", "batch_id", "chain"])
      expect(
        sql.some((statement) =>
          statement.startsWith(`alter table "queue"."jobs" add column "${column}"`),
        ),
      ).toBe(true);
  });

  it("builds the per-scope index concurrently, outside a transaction", () => {
    const index = steps.find((step) =>
      step.sql.some((statement) => statement.includes("idx_jobs_queue_scope_id_status")),
    );
    expect(index?.transactional).toBe(false);
    expect(index?.sql.join("\n")).toContain("concurrently");
  });

  it("creates the batch table with its counters", () => {
    const create = sql.find((statement) =>
      statement.startsWith('create table "queue"."job_batches"'),
    );
    expect(create).toContain('"done" integer default 0 not null');
    expect(create).toContain('"failed" integer default 0 not null');
    for (const column of ["total", "done", "failed"])
      expect(
        sql.some((statement) =>
          statement.startsWith(`comment on column "queue"."job_batches"."${column}"`),
        ),
      ).toBe(true);
  });
});
