/**
 * Stackra file contract:
 * Purpose: integration test of `MigrationsCheckService` on a real Postgres: after the member's compiled migrations run
 *          through the real runner (`migrate`, which writes `schema_migrations`), the check is up; a dirty version, an
 *          empty ledger, a missing ledger and a missing model table each make it down.
 * Boundary: integration tier (`.int`, `stackra test --tier int`, Docker); the migrations are the `.stackra/migrations` gen
 *           writes for this member, applied by the same function `stackra db migrate` calls. The tests run in order
 *           and each puts back what it changed; the last makes its own table and drops it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0159 (`schema_migrations`); ADR 0182 (test tiers); ADR 0190 (health).
 */
import { fileURLToPath } from "node:url";

import { HealthStatus } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { migrate } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { MigrationsCheckService } from "#modules/health/services/migrations-check.service";

/** The member's folder, where `.stackra/migrations` lives. */
const memberRoot = fileURLToPath(new URL("../../../../../", import.meta.url));

// An empty migration list: the container starts bare and the real runner applies the compiled files.
const postgres = usePostgres({ migrations: [] });

/** The check over the connected database. */
const check = () => new MigrationsCheckService(postgres.database).check();

/** Runs `sql` as the container's user. */
const run = (sql: string) => postgres.database.em().execute(sql);

describe(MigrationsCheckService, () => {
  beforeAll(async () => {
    process.env["DATABASE_DIRECT_URL"] = postgres.url;
    await migrate({ cwd: memberRoot, environment: "dev" });
  }, 120_000);

  /** The runner's own ledger and tables satisfy the check. */
  it("is up after the compiled migrations ran", async () => {
    const report = await check();
    expect(report).toMatchObject({ status: HealthStatus.Up });
    const [ledger] = (await run("select version, dirty from schema_migrations")) as {
      version: string | number;
      dirty: boolean;
    }[];
    expect(ledger?.dirty).toBe(false);
    expect(Number(ledger?.version)).toBeGreaterThan(0);
  });

  /** A migration that crashed mid-file leaves the version dirty. */
  it("is down on a dirty version", async () => {
    await run("update schema_migrations set dirty = true");
    try {
      const report = await check();
      expect(report.status).toBe(HealthStatus.Down);
      expect(report.detail).toMatch(/^version \d+ is dirty$/);
    } finally {
      await run("update schema_migrations set dirty = false");
    }
    expect((await check()).status).toBe(HealthStatus.Up);
  });

  /** A ledger with no row means nothing was applied. */
  it("is down on an empty ledger", async () => {
    const rows = (await run("select version, dirty from schema_migrations")) as {
      version: string | number;
      dirty: boolean;
    }[];
    await run("delete from schema_migrations");
    try {
      expect(await check()).toEqual({
        status: HealthStatus.Down,
        detail: "the migration ledger holds no single version",
      });
    } finally {
      for (const row of rows)
        await run(`insert into schema_migrations (version, dirty) values (${row.version}, false)`);
    }
    expect((await check()).status).toBe(HealthStatus.Up);
  });

  /** No ledger table at all (the database was never migrated) is down, and the error's text stays out of the report. */
  it("is down when the ledger table does not exist", async () => {
    await run("alter table schema_migrations rename to schema_migrations_kept");
    try {
      const report = await check();
      expect(report.status).toBe(HealthStatus.Down);
      expect(report.detail).toMatch(/^the migration state could not be read \(\w+\)$/);
      expect(report.detail).not.toContain("schema_migrations");
    } finally {
      await run("alter table schema_migrations_kept rename to schema_migrations");
    }
    expect((await check()).status).toBe(HealthStatus.Up);
  });

  /** The build is newer than the database: a model's table is not there. The catalogue lookup is the real one. */
  it("is down, naming the table, when a model's table is missing", async () => {
    // This member hosts no model of its own, so the metadata is scripted and the table is a real one, quoted as is.
    const real = postgres.database.em();
    const models = [{ schema: "health_probe", tableName: "Probe Rows" }];
    const database = {
      em: () => ({
        execute: (sql: string, params?: unknown[]) => real.execute(sql, params),
        getMetadata: () => ({
          getAll: () => new Map(models.map((meta, i) => [`Probe${i}`, meta])),
        }),
      }),
    } as unknown as Database;
    await run(
      'create schema health_probe; create table "health_probe"."Probe Rows" (id int primary key)',
    );
    expect((await new MigrationsCheckService(database).check()).status).toBe(HealthStatus.Up);
    await run('drop table "health_probe"."Probe Rows"');
    const report = await new MigrationsCheckService(database).check();
    expect(report).toEqual({
      status: HealthStatus.Down,
      detail: '1 tables are not migrated: "health_probe"."Probe Rows"',
    });
  });
});
