/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractSearchIndexTenancyMigration` on real Postgres, over the registry's migrations
 *          before it: the pre-flight refuses an index below a tenant node, naming the count and the remedy, and changes
 *          nothing; applied, the backfill gives an index at a tenant node (nlevel 3) its scope as owner and keeps one
 *          with no scope, at the root or a product node, a platform row, every `-` scope key becomes NULL, and the new
 *          key keeps a tenant's and the platform's platform-wide index of one model apart while refusing a second of
 *          either; and `assertRowSecurity`, strict, with the compiled migrations as its directory, finds no gap.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres. One fresh database for
 *           the file with migrations 0005 and 0006 (`ownerPostgres(2)`); the superuser seeds the rows, applies 0010 as
 *           a migrator would, and reads the catalogue. The audit probes with its own NOBYPASSRLS role. Tests run in
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
  registryMigrations,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";

/** Two tenants under product alpha, as their scope node ids. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

/** Product alpha's node. */
const ALPHA = "scp_01jab3k4m5n6p7q8r9s0t1v2w6";

describe.skipIf(HOST === undefined)("ContractSearchIndexTenancyMigration on Postgres", () => {
  let postgres: OwnerPostgres;
  const contract = registryMigrations()[2];

  beforeAll(async () => {
    postgres = await ownerPostgres(2);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds the index of `model` keyed `key`, at scope `id`/`path` (none: platform-wide). */
  const seed = (model: string, key: string, scope: string | null, path: string | null) =>
    superuser(
      `insert into search.indexes (model, scope_key, created_at, updated_at, scope_id, scope_path, state, facet_hash)
         values (?, ?, now(), now(), ?, ?, 'valid', 'abc')`,
      [model, key, scope, path],
    );

  /** Whether `search.indexes` holds the owner column yet. */
  const contracted = async () =>
    (
      await superuser(
        "select 1 from information_schema.columns where table_schema = 'search' and table_name = 'indexes' and column_name = 'tenant_id'",
      )
    ).length > 0;

  it("refuses an index below a tenant node, naming the count and the remedy, and changes nothing", async () => {
    if (contract === undefined) throw new Error("0010 is not compiled");
    const branch = "scp_01jab3k4m5n6p7q8r9s0t1v2w5";
    await seed("Product", branch, branch, "platform.alpha.acme.north");
    await expect(postgres.apply(contract)).rejects.toThrow(
      /rows with a null tenant_id: search\.indexes 1\. .*run search:reindex in each node's tenant/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from search.indexes");
  });

  it("backfills a tenant node's index, keeps the platform's and replaces the - key with NULL", async () => {
    if (contract === undefined) throw new Error("0010 is not compiled");
    await seed("Product", ACME, ACME, "platform.alpha.acme");
    await seed("Product", ALPHA, ALPHA, "platform.alpha");
    await seed("Product", "-", null, null);
    await postgres.apply(contract);
    expect(
      await superuser(
        "select scope_key, tenant_id from search.indexes order by scope_key nulls first",
      ),
    ).toEqual([
      { scope_key: null, tenant_id: null },
      { scope_key: ACME, tenant_id: ACME },
      { scope_key: ALPHA, tenant_id: null },
    ]);
  });

  it("keeps a tenant's and the platform's platform-wide index apart, and refuses a second of either", async () => {
    const insert = (owner: string | null) =>
      superuser(
        `insert into search.indexes (model, scope_key, created_at, updated_at, state, facet_hash, tenant_id)
           values ('Product', null, now(), now(), 'valid', 'abc', ?)`,
        [owner],
      );
    await insert(GLOBEX);
    await expect(insert(GLOBEX)).rejects.toThrow(/idx_indexes_tenant_id_model_scope_key/);
    await expect(insert(null)).rejects.toThrow(/idx_indexes_tenant_id_model_scope_key/);
    await superuser("delete from search.indexes where tenant_id = ?", [GLOBEX]);
  });

  it("passes the strict row-security audit, its system access held to the compiled declarations", async () => {
    const directory = mkdtempSync(join(tmpdir(), "search-migrations-"));
    try {
      for (const [index, migration] of registryMigrations().entries())
        for (const [part, step] of migration.steps.entries())
          writeFileSync(
            join(
              directory,
              `${String(index * 100 + part + 1).padStart(4, "0")}_search_${index + 1}_${part}.up.sql`,
            ),
            `${step.transactional ? "" : "-- stackra:transactional=false\n"}${step.sql.join(";\n")};\n`,
          );
      await expect(
        assertRowSecurity(postgres.database, {
          column: "tenant_id",
          setting: "app.tenant_id",
          role: "search_audit_probe",
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
