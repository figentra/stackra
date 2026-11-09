/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractQueueTenancyMigration` on real Postgres, over the queue migrations before it:
 *          the pre-flight refuses a job below a tenant node, naming the count and the drain remedy, and changes
 *          nothing; applied, the backfill gives a job at a tenant node (depth 3) its scope as owner and keeps a job with
 *          no scope, at the root or at a product node a platform job; `queue.job_batches` stays a platform table; and
 *          `assertRowSecurity`, strict, with the compiled migrations as its directory (so the `t.systemAccess` and
 *          `schema.systemFunction` declarations are held to their grants), finds no gap.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres. One fresh database for
 *           the file with migrations 0001 and 0002 (`ownerPostgres(2)`); the superuser seeds the rows, applies 0003 as a
 *           migrator would, and reads the catalogue. The audit probes with its own NOBYPASSRLS role. Tests run in order.
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
  queueMigrations,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";

/** Two tenants under product alpha, as their scope node ids. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

/** A node below acme: a branch or a child tenant, which the migration cannot tell apart. */
const BRANCH = "scp_01jab3k4m5n6p7q8r9s0t1v2w5";

describe.skipIf(HOST === undefined)("ContractQueueTenancyMigration on Postgres", () => {
  let postgres: OwnerPostgres;
  const contract = queueMigrations()[2];

  beforeAll(async () => {
    postgres = await ownerPostgres(2);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds job `id` queued at scope `scope`/`path` (none: no scope). */
  const seedJob = (id: string, scope: string | null, path: string | null) =>
    superuser(
      `insert into queue.jobs (id, queue, job_key, input, status, attempts, run_at, lease, scope_id, scope_path)
         values (?, 'default', 'touch.run', '{}'::jsonb, 'waiting', 0, now(), 'PT1M', ?, ?)`,
      [id, scope, path],
    );

  /** Whether `queue.jobs` holds the owner column yet. */
  const contracted = async () =>
    (
      await superuser(
        "select 1 from information_schema.columns where table_schema = 'queue' and table_name = 'jobs' and column_name = 'tenant_id'",
      )
    ).length > 0;

  it("refuses a job below a tenant node, naming the count and the drain remedy, and changes nothing", async () => {
    if (contract === undefined) throw new Error("0003 is not compiled");
    await seedJob("job_deep", BRANCH, "platform.alpha.acme.north");
    await expect(postgres.apply(contract)).rejects.toThrow(
      /rows with a null tenant_id: queue\.jobs 1\. .*Drain the queue first: let reserved and pending jobs finish or fail, delete those dead jobs, then migrate again\./,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from queue.jobs");
  });

  it("backfills a tenant node's jobs and keeps the platform's, the batch table untouched", async () => {
    if (contract === undefined) throw new Error("0003 is not compiled");
    await seedJob("job_acme", ACME, "platform.alpha.acme");
    await seedJob("job_globex", GLOBEX, "platform.alpha.globex");
    await seedJob("job_product", "scp_01jab3k4m5n6p7q8r9s0t1v2w6", "platform.alpha");
    await seedJob("job_root", "scp_01jab3k4m5n6p7q8r9s0t1v2w7", "platform");
    await seedJob("job_none", null, null);
    await postgres.apply(contract);
    expect(await superuser("select id, tenant_id from queue.jobs order by id")).toEqual([
      { id: "job_acme", tenant_id: ACME },
      { id: "job_globex", tenant_id: GLOBEX },
      { id: "job_none", tenant_id: null },
      { id: "job_product", tenant_id: null },
      { id: "job_root", tenant_id: null },
    ]);
    expect(
      await superuser(
        "select relname, relrowsecurity as enabled, relforcerowsecurity as forced from pg_class where relnamespace = 'queue'::regnamespace and relkind = 'r' order by relname",
      ),
    ).toEqual([
      { relname: "job_batches", enabled: false, forced: false },
      { relname: "jobs", enabled: true, forced: true },
    ]);
  });

  it("passes the strict row-security audit, its system access held to the compiled declarations", async () => {
    const directory = mkdtempSync(join(tmpdir(), "queue-migrations-"));
    try {
      for (const [index, migration] of queueMigrations().entries())
        for (const [part, step] of migration.steps.entries())
          writeFileSync(
            join(
              directory,
              `${String(index * 100 + part + 1).padStart(4, "0")}_queue_${index + 1}_${part}.up.sql`,
            ),
            `${step.transactional ? "" : "-- stackra:transactional=false\n"}${step.sql.join(";\n")};\n`,
          );
      await expect(
        assertRowSecurity(postgres.database, {
          column: "tenant_id",
          setting: "app.tenant_id",
          role: "queue_audit_probe",
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
