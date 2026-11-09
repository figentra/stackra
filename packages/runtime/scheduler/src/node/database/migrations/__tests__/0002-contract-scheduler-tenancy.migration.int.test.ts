/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractSchedulerTenancyMigration` on real Postgres, over the first scheduler
 *          migration: the pre-flight refuses a schedule below a tenant node, naming the count and the remedy
 *          (unschedule, migrate, schedule again), and changes nothing; applied, the backfill gives a schedule at a
 *          tenant node (nlevel 3) its scope as owner and keeps one at the root or at a product node a platform
 *          schedule; `scheduler.watermarks` stays a platform table; and, with 0003's `scheduler.fires` applied,
 *          `assertRowSecurity`, strict, with the compiled migrations as its directory, finds no gap.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres. One fresh database for
 *           the file with migration 0001 (`ownerPostgres(1)`); the superuser seeds the rows, applies 0002 as a migrator
 *           would, and reads the catalogue. The audit probes with its own NOBYPASSRLS role. Tests run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0347 (decision 5: the catalogue audit); ADR
 *                     0159 (as amended); ADR 0182 (integration tier); `.agents/rules/tenancy.md` (points 7 and 8).
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { assertRowSecurity } from "@stackra/database/testing";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import {
  HOST,
  ownerPostgres,
  schedulerMigrations,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";

/** Two tenants under product alpha, as their scope node ids. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

/** A node below acme: a branch or a child tenant, which the migration cannot tell apart. */
const BRANCH = "scp_01jab3k4m5n6p7q8r9s0t1v2w5";

describe.skipIf(HOST === undefined)("ContractSchedulerTenancyMigration on Postgres", () => {
  let postgres: OwnerPostgres;
  const contract = schedulerMigrations()[1];

  beforeAll(async () => {
    postgres = await ownerPostgres(1);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds schedule `id` made at scope `scope`/`path`. */
  const seedSchedule = (id: string, scope: string, path: string) =>
    superuser(
      `insert into scheduler.schedules (id, scope_id, scope_path, job_key, cron, time_zone, input, misfire)
         values (?, ?, ?::ltree, 'digests.digest.send@1', '0 8 * * *', 'UTC', '{}'::jsonb, 'once')`,
      [id, scope, path],
    );

  /** Whether `scheduler.schedules` holds the owner column yet. */
  const contracted = async () =>
    (
      await superuser(
        "select 1 from information_schema.columns where table_schema = 'scheduler' and table_name = 'schedules' and column_name = 'tenant_id'",
      )
    ).length > 0;

  it("refuses a schedule below a tenant node, naming the count and the remedy, and changes nothing", async () => {
    if (contract === undefined) throw new Error("0002 is not compiled");
    await seedSchedule("sch_deep", BRANCH, "platform.alpha.acme.north");
    await expect(postgres.apply(contract)).rejects.toThrow(
      /rows with a null tenant_id: scheduler\.schedules 1\. .*unschedule it, migrate again, then schedule it again from a call in its scope/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from scheduler.schedules");
  });

  it("backfills a tenant node's schedules and keeps the platform's, the watermarks untouched", async () => {
    if (contract === undefined) throw new Error("0002 is not compiled");
    await seedSchedule("sch_acme", ACME, "platform.alpha.acme");
    await seedSchedule("sch_globex", GLOBEX, "platform.alpha.globex");
    await seedSchedule("sch_product", "scp_01jab3k4m5n6p7q8r9s0t1v2w6", "platform.alpha");
    await seedSchedule("sch_root", "scp_01jab3k4m5n6p7q8r9s0t1v2w7", "platform");
    await postgres.apply(contract);
    expect(await superuser("select id, tenant_id from scheduler.schedules order by id")).toEqual([
      { id: "sch_acme", tenant_id: ACME },
      { id: "sch_globex", tenant_id: GLOBEX },
      { id: "sch_product", tenant_id: null },
      { id: "sch_root", tenant_id: null },
    ]);
    expect(
      await superuser(
        "select relname, relrowsecurity as enabled, relforcerowsecurity as forced from pg_class where relnamespace = 'scheduler'::regnamespace and relkind = 'r' order by relname",
      ),
    ).toEqual([
      { relname: "schedules", enabled: true, forced: true },
      { relname: "watermarks", enabled: false, forced: false },
    ]);
  });

  it("passes the strict row-security audit, its system access held to the compiled declarations", async () => {
    const fires = schedulerMigrations()[2];
    if (fires === undefined) throw new Error("0003 is not compiled");
    await postgres.apply(fires);
    const directory = mkdtempSync(join(tmpdir(), "scheduler-migrations-"));
    try {
      for (const [index, migration] of schedulerMigrations().entries())
        for (const [part, step] of migration.steps.entries())
          writeFileSync(
            join(
              directory,
              `${String(index * 100 + part + 1).padStart(4, "0")}_scheduler_${index + 1}_${part}.up.sql`,
            ),
            `${step.transactional ? "" : "-- stackra:transactional=false\n"}${step.sql.join(";\n")};\n`,
          );
      await expect(
        assertRowSecurity(postgres.database, {
          column: "tenant_id",
          setting: "app.tenant_id",
          role: "scheduler_audit_probe",
          probe: [ACME, GLOBEX],
          migrationsDirectory: directory,
          strict: true,
        }),
      ).resolves.toEqual([]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
