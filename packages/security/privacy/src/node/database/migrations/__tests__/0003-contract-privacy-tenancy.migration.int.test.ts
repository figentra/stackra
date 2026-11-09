/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractPrivacyTenancyMigration` on real Postgres, over the privacy migrations before
 *          it: the exact backfill moves each table's partition into its owner (a tenant's id stays, `-` becomes NULL,
 *          the platform's), keeps the old column nullable (filled on insert for the previous release) and drops its
 *          policy; a salt's new key keeps a tenant's and the platform's salt of one subject apart and refuses a second
 *          of either; and `assertRowSecurity`, strict, with the compiled
 *          migrations as its directory (so the `t.systemAccess` and `schema.systemFunction` declarations are held to
 *          their grants), finds no gap.
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
  privacyMigrations,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";

/** Two tenants, as their scope node ids. */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3";
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4";

describe.skipIf(HOST === undefined)("ContractPrivacyTenancyMigration on Postgres", () => {
  let postgres: OwnerPostgres;

  beforeAll(async () => {
    postgres = await ownerPostgres(2);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** Stores a salt of `usr_1` owned by `owner` (null: the platform), past row security. */
  const insert = (owner: string | null) =>
    superuser(
      "insert into privacy.subject_salts (tenant_id, subject, salt, created_at) values (?, 'usr_1', 'x', now())",
      [owner],
    );

  it("moves each partition into its owner exactly, the - partition becoming the platform's", async () => {
    const contract = privacyMigrations()[2];
    if (contract === undefined) throw new Error("0003 is not compiled");
    await superuser(
      `insert into privacy.subject_salts (scope_id, subject, salt, created_at)
         values (?, 'usr_1', 'a', now()), ('-', 'usr_1', 'p', now())`,
      [ACME],
    );
    await superuser(
      `insert into privacy.legal_holds (id, scope_id, model, record_id, reason, placed_at)
         values ('lgh_a', ?, 'User', 'usr_1', 'Matter', now()), ('lgh_p', '-', 'User', 'usr_1', 'Matter', now())`,
      [GLOBEX],
    );
    await superuser(
      `insert into privacy.legal_hold_refusals (scope_id, model, record_id, disposal, at)
         values (?, 'User', 'usr_1', 'purge', now())`,
      [ACME],
    );
    await postgres.apply(contract);
    expect(
      await superuser("select tenant_id, salt from privacy.subject_salts order by salt"),
    ).toEqual([
      { tenant_id: ACME, salt: "a" },
      { tenant_id: null, salt: "p" },
    ]);
    expect(await superuser("select id, tenant_id from privacy.legal_holds order by id")).toEqual([
      { id: "lgh_a", tenant_id: GLOBEX },
      { id: "lgh_p", tenant_id: null },
    ]);
    expect(await superuser("select tenant_id from privacy.legal_hold_refusals")).toEqual([
      { tenant_id: ACME },
    ]);
    expect(
      await superuser(
        "select table_name, is_nullable from information_schema.columns where table_schema = 'privacy' and column_name = 'scope_id' order by table_name",
      ),
    ).toEqual(
      ["legal_hold_refusals", "legal_holds", "subject_salts"].map((table_name) => ({
        table_name,
        is_nullable: "YES",
      })),
    );
    expect(
      await superuser(
        "select polname from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'privacy' and polname like '%scope_id%'",
      ),
    ).toEqual([]);
  });

  it("keeps a tenant's and the platform's salt of one subject apart, and refuses a second of either", async () => {
    await insert(GLOBEX);
    await expect(insert(GLOBEX)).rejects.toThrow(/duplicate key/);
    await expect(insert(null)).rejects.toThrow(/duplicate key/);
    // the previous release's partition is filled on insert, so its reads still find the row
    expect(
      await superuser("select scope_id from privacy.subject_salts where tenant_id = ?", [GLOBEX]),
    ).toEqual([{ scope_id: GLOBEX }]);
  });

  it("passes the strict row-security audit, its system access held to the compiled declarations", async () => {
    const directory = mkdtempSync(join(tmpdir(), "privacy-migrations-"));
    try {
      for (const [index, migration] of privacyMigrations().entries())
        for (const [part, step] of migration.steps.entries())
          writeFileSync(
            join(
              directory,
              `${String(index * 100 + part + 1).padStart(4, "0")}_privacy_${index + 1}_${part}.up.sql`,
            ),
            `${step.transactional ? "" : "-- stackra:transactional=false\n"}${step.sql.join(";\n")};\n`,
          );
      await expect(
        assertRowSecurity(postgres.database, {
          column: "tenant_id",
          setting: "app.tenant_id",
          role: "privacy_audit_probe",
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
