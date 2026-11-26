/**
 * Stackra file contract:
 * Purpose: unit tests of `CreateBackfillRunsMigration`: one transactional step that declares the platform table, then
 *          creates `database.backfill_runs` keyed by the backfill's key with its cursor, counts, finish time and error
 *          code, every column commented (STA-1406).
 * Boundary: test only; pure compilation, no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0159 (decision 3); ADR 0239 (2026-11-07 amendment, group (c)); ADR 0022.
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import { tableDeclarations } from "#core/functions/table-declarations.function";
import { CreateBackfillRunsMigration } from "#node/database/migrations/0009-create-backfill-runs.migration";

describe("CreateBackfillRunsMigration", () => {
  const { after, steps } = compileMigration(CreateBackfillRunsMigration, { schema: "database" });
  const sql = steps.flatMap((step) => step.sql);

  it("is one transactional step with no edges, undone by dropping the table", () => {
    expect(after).toEqual([]);
    expect(steps).toHaveLength(1);
    expect(steps[0]?.transactional).toBe(true);
    expect(steps[0]?.inverse).toEqual(['drop table if exists "database"."backfill_runs"']);
  });

  it("creates the ledger keyed by the backfill's key", () => {
    expect(sql).toContain(
      [
        'create table "database"."backfill_runs" (',
        '  "key" varchar(127) not null,',
        '  "last_key" text null,',
        '  "rows_done" bigint default 0 not null,',
        '  "batches" integer default 0 not null,',
        '  "finished_at" timestamptz null,',
        '  "last_error" varchar(63) null,',
        '  "created_at" timestamptz default now() not null,',
        '  "updated_at" timestamptz default now() not null,',
        '  primary key ("key")',
        ")",
      ].join("\n"),
    );
    expect(sql.filter((statement) => statement.startsWith("comment on column"))).toHaveLength(8);
  });

  it("declares a platform table, which the row-security audit reads", () => {
    const { platform } = tableDeclarations(sql.map((statement) => `${statement};\n`).join(""));
    expect(platform.get("database.backfill_runs")).toBe(
      "one row per backfill key: a platform job's progress over every tenant's rows",
    );
  });
});
