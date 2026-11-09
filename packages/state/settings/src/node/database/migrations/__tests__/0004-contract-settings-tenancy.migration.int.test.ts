/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractSettingsTenancyMigration` on real Postgres, over every settings migration
 *          before it: the pre-flight refuses a row below a tenant node and a user's row, naming the counts and the
 *          remedy, and changes nothing; applied, the backfill gives a row at a tenant node (nlevel 3) its scope as owner
 *          and keeps a row at the root or a product node a platform row; the new user key lets a tenant's and the
 *          platform's row of one user stand side by side and refuses a second platform row; and `assertRowSecurity`,
 *          strict, with the compiled migrations as its directory (so every `t.systemAccess` and `schema.systemFunction`
 *          declaration is held to its grants), finds no gap.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres. One fresh database for
 *           the file with migrations 0001 to 0003 (`ownerPostgres(3)`); the superuser seeds the rows, applies 0004 as a
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
  settingsMigrations,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";

/** Two tenants under product alpha, as their scope node ids. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

/** A node below acme: a branch or a child tenant, which the migration cannot tell apart. */
const BRANCH = "scp_01jab3k4m5n6p7q8r9s0t1v2w5";

const USER = "usr_01jab3k4m5n6p7q8r9s0t1v2w6";

describe.skipIf(HOST === undefined)("ContractSettingsTenancyMigration on Postgres", () => {
  let postgres: OwnerPostgres;
  const contract = settingsMigrations()[3];

  beforeAll(async () => {
    postgres = await ownerPostgres(3);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Seeds stored setting `id` of group `orders` at node `scope`/`path`, or of `user` (no node). */
  const seedSetting = (
    id: string,
    scope: string | null,
    path: string | null,
    user: string | null = null,
  ) =>
    superuser(
      `insert into settings.stored_settings (id, created_at, updated_at, group_key, scope_id, scope_path, user_id)
         values (?, now(), now(), 'orders', ?, ?::ltree, ?)`,
      [id, scope, path, user],
    );

  /** Seeds a scheduled revision `id` of group `orders` at node `scope`/`path`, or of `user`. */
  const seedRevision = (
    id: string,
    scope: string | null,
    path: string | null,
    user: string | null = null,
  ) =>
    superuser(
      `insert into settings.stored_setting_revisions
         (id, created_at, updated_at, group_key, scope_id, scope_path, user_id, author, environment, status, effective_at)
         values (?, now(), now(), 'orders', ?, ?::ltree, ?, 'usr_a', 'live', 'scheduled', now())`,
      [id, scope, path, user],
    );

  /** Whether `settings.stored_settings` holds the owner column yet. */
  const contracted = async () =>
    (
      await superuser(
        "select 1 from information_schema.columns where table_schema = 'settings' and table_name = 'stored_settings' and column_name = 'tenant_id'",
      )
    ).length > 0;

  it("refuses a setting below a tenant node, naming the count and the remedy, and changes nothing", async () => {
    if (contract === undefined) throw new Error("0004 is not compiled");
    await seedSetting("sst_deep", BRANCH, "platform.alpha.acme.north");
    await seedRevision("ssr_deep", BRANCH, "platform.alpha.acme.north");
    await expect(postgres.apply(contract)).rejects.toThrow(
      /rows with a null tenant_id: settings\.stored_settings 1, settings\.stored_setting_revisions 1\. .*Record those nodes' values/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from settings.stored_settings");
    await superuser("delete from settings.stored_setting_revisions");
  });

  it("refuses a user's row, which names no tenant, with the users' remedy", async () => {
    if (contract === undefined) throw new Error("0004 is not compiled");
    await seedSetting("sst_user", null, null, USER);
    await expect(postgres.apply(contract)).rejects.toThrow(
      /settings\.stored_settings 1\. .*readable by every tenant\. Record those users' values/,
    );
    expect(await contracted()).toBe(false);
    await superuser("delete from settings.stored_settings");
  });

  it("backfills a tenant node's rows and keeps the root's and a product's as the platform's", async () => {
    if (contract === undefined) throw new Error("0004 is not compiled");
    await seedSetting("sst_acme", ACME, "platform.alpha.acme");
    await seedSetting("sst_product", "scp_01jab3k4m5n6p7q8r9s0t1v2w7", "platform.alpha");
    await seedSetting("sst_root", "scp_01jab3k4m5n6p7q8r9s0t1v2w8", "platform");
    await seedRevision("ssr_globex", GLOBEX, "platform.alpha.globex");
    await seedRevision("ssr_root", null, null);
    await postgres.apply(contract);
    expect(
      await superuser("select id, tenant_id from settings.stored_settings order by id"),
    ).toEqual([
      { id: "sst_acme", tenant_id: ACME },
      { id: "sst_product", tenant_id: null },
      { id: "sst_root", tenant_id: null },
    ]);
    expect(
      await superuser("select id, tenant_id from settings.stored_setting_revisions order by id"),
    ).toEqual([
      { id: "ssr_globex", tenant_id: GLOBEX },
      { id: "ssr_root", tenant_id: null },
    ]);
  });

  it("keeps a tenant's and the platform's row of one user apart, and refuses a second platform row", async () => {
    await superuser(
      `insert into settings.stored_settings (id, created_at, updated_at, group_key, user_id, tenant_id)
         values ('sst_user_acme', now(), now(), 'orders', ?, ?), ('sst_user_globex', now(), now(), 'orders', ?, ?),
                ('sst_user_platform', now(), now(), 'orders', ?, null)`,
      [USER, ACME, USER, GLOBEX, USER],
    );
    await expect(
      superuser(
        `insert into settings.stored_settings (id, created_at, updated_at, group_key, user_id, tenant_id)
           values ('sst_user_again', now(), now(), 'orders', ?, null)`,
        [USER],
      ),
    ).rejects.toThrow(/idx_stored_settings_tenant_id_group_key_user_id/);
    await expect(
      superuser(
        `insert into settings.stored_settings (id, created_at, updated_at, group_key, user_id, tenant_id)
           values ('sst_user_acme_2', now(), now(), 'orders', ?, ?)`,
        [USER, ACME],
      ),
    ).rejects.toThrow(/idx_stored_settings_tenant_id_group_key_user_id/);
    await superuser("delete from settings.stored_settings where user_id is not null");
  });

  it("passes the strict row-security audit, its system access held to the compiled declarations", async () => {
    const directory = mkdtempSync(join(tmpdir(), "settings-migrations-"));
    try {
      for (const [index, migration] of settingsMigrations().entries())
        for (const [part, step] of migration.steps.entries())
          writeFileSync(
            join(
              directory,
              `${String(index * 100 + part + 1).padStart(4, "0")}_settings_${index + 1}_${part}.up.sql`,
            ),
            `${step.transactional ? "" : "-- stackra:transactional=false\n"}${step.sql.join(";\n")};\n`,
          );
      await expect(
        assertRowSecurity(postgres.database, {
          column: "tenant_id",
          setting: "app.tenant_id",
          role: "settings_audit_probe",
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
