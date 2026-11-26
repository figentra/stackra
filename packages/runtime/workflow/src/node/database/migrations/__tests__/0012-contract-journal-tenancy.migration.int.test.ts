/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractJournalTenancyMigration` on real Postgres, over every workflow migration
 *          before it: the pre-flight refuses a run or a held signal below a tenant node, naming the count and the
 *          remedy, and changes nothing; applied, the backfill gives a run at a tenant node (nlevel 3) its scope as
 *          owner and keeps a run with no scope, at the root or at a product node a platform run, a step takes its
 *          run's owner, a held signal the run that awaits it, and a signal no run awaits its own scope's; and
 *          `assertRowSecurity`, strict, with the compiled migrations as its directory (so every `t.systemAccess` and
 *          `schema.systemFunction` declaration is held to its grants), finds no gap.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres. One fresh database for
 *           the file with migrations 0001 to 0011 (`ownerPostgres(11)`); the superuser seeds the rows, applies 0012 as a
 *           migrator would, and reads the catalogue. The audit probes with its own NOBYPASSRLS role. Tests run in
 *           order.
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
  workflowMigrations,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";

/** Two tenants under product alpha, as their scope node ids. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

/** A node below acme: a branch or a child tenant, which the migration cannot tell apart. */
const BRANCH = "scp_01jab3k4m5n6p7q8r9s0t1v2w5";

const NOW = new Date("2026-11-09T12:00:00.000Z");

describe.skipIf(HOST === undefined)("ContractJournalTenancyMigration on Postgres", () => {
  let postgres: OwnerPostgres;
  const contract = workflowMigrations()[11];

  beforeAll(async () => {
    postgres = await ownerPostgres(11);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds run `id` at scope `scope`/`path` (none: no scope), waiting on `Shipped` for `o1` when `waiting`. */
  const seedRun = async (
    id: string,
    scope: string | null,
    path: string | null,
    waiting = false,
  ) => {
    await superuser(
      `insert into workflow.runs (id, workflow, status, input, origin, scope_id, scope_path, started_at)
         values (?, 'ShipWorkflow', ?, '{}'::jsonb, '{}'::jsonb, ?, ?::ltree, ?)`,
      [id, waiting ? "waiting" : "completed", scope, path, NOW],
    );
    await superuser(
      `insert into workflow.steps (run_id, name, position, status, signal, correlation, started_at)
         values (?, 'ship', 0, ?, 'Shipped', 'o1', ?)`,
      [id, waiting ? "waiting" : "done", NOW],
    );
  };

  /** Seeds held signal `id` of `Shipped` for `correlation` at scope `scope`/`path`. */
  const seedSignal = (id: string, correlation: string, scope: string | null, path: string | null) =>
    superuser(
      `insert into workflow.signals (id, signal, correlation, payload, scope_id, scope_path, received_at, expires_at)
         values (?, 'Shipped', ?, '{}'::jsonb, ?, ?::ltree, ?, ?)`,
      [id, correlation, scope, path, NOW, NOW],
    );

  /** Whether `workflow.runs` holds the owner column yet. */
  const contracted = async () =>
    (
      await superuser(
        "select 1 from information_schema.columns where table_schema = 'workflow' and table_name = 'runs' and column_name = 'tenant_id'",
      )
    ).length > 0;

  it("refuses a run below a tenant node, naming the count and the remedy, and changes nothing", async () => {
    if (contract === undefined) throw new Error("0012 is not compiled");
    await seedRun("wfr_deep", BRANCH, "platform.alpha.acme.north", true);
    await expect(postgres.apply(contract)).rejects.toThrow(
      /rows with a null tenant_id: workflow\.runs 1\. .*Finish or cancel the running, waiting and compensating workflows/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from workflow.runs");
  });

  it("refuses a held signal below a tenant node with its remedy", async () => {
    if (contract === undefined) throw new Error("0012 is not compiled");
    await seedSignal("wfs_deep", "o9", BRANCH, "platform.alpha.acme.north");
    await expect(postgres.apply(contract)).rejects.toThrow(
      /workflow\.signals 1\. .*Let the waiting runs take those signals/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from workflow.signals");
  });

  it("backfills runs by scope, steps by their run and signals by the run awaiting them", async () => {
    if (contract === undefined) throw new Error("0012 is not compiled");
    await seedRun("wfr_acme", ACME, "platform.alpha.acme", true);
    await seedRun("wfr_product", "scp_01jab3k4m5n6p7q8r9s0t1v2w6", "platform.alpha");
    await seedRun("wfr_root", "scp_01jab3k4m5n6p7q8r9s0t1v2w7", "platform");
    await seedRun("wfr_none", null, null);
    await seedSignal("wfs_awaited", "o1", ACME, "platform.alpha.acme");
    await seedSignal("wfs_early", "o2", GLOBEX, "platform.alpha.globex");
    await seedSignal("wfs_none", "o3", null, null);
    await postgres.apply(contract);
    expect(await superuser("select id, tenant_id from workflow.runs order by id")).toEqual([
      { id: "wfr_acme", tenant_id: ACME },
      { id: "wfr_none", tenant_id: null },
      { id: "wfr_product", tenant_id: null },
      { id: "wfr_root", tenant_id: null },
    ]);
    expect(await superuser("select run_id, tenant_id from workflow.steps order by run_id")).toEqual(
      [
        { run_id: "wfr_acme", tenant_id: ACME },
        { run_id: "wfr_none", tenant_id: null },
        { run_id: "wfr_product", tenant_id: null },
        { run_id: "wfr_root", tenant_id: null },
      ],
    );
    expect(await superuser("select id, tenant_id from workflow.signals order by id")).toEqual([
      { id: "wfs_awaited", tenant_id: ACME },
      { id: "wfs_early", tenant_id: GLOBEX },
      { id: "wfs_none", tenant_id: null },
    ]);
  });

  it("passes the strict row-security audit, its system access held to the compiled declarations", async () => {
    const directory = mkdtempSync(join(tmpdir(), "workflow-migrations-"));
    try {
      for (const [index, migration] of workflowMigrations().entries())
        for (const [part, step] of migration.steps.entries())
          writeFileSync(
            join(
              directory,
              `${String(index * 100 + part + 1).padStart(4, "0")}_workflow_${index + 1}_${part}.up.sql`,
            ),
            `${step.transactional ? "" : "-- stackra:transactional=false\n"}${step.sql.join(";\n")};\n`,
          );
      await expect(
        assertRowSecurity(postgres.database, {
          column: "tenant_id",
          setting: "app.tenant_id",
          role: "workflow_audit_probe",
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
