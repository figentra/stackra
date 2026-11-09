/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractAchievementsTenancyMigration` on real Postgres, over every achievements
 *          migration before it (the expand step included): with a row whose `tenant_id` is null the pre-flight refuses,
 *          naming the table's count, and changes nothing; on clean data it applies, each of `award_kinds` and `awards`
 *          has `tenant_id` NOT NULL, `pol_<table>_tenant_id` as its one permissive policy and the scope path
 *          restrictive, and `assertRowSecurity` proves one tenant never sees, nor moves a row to, another's, with no
 *          warning for these tables; `award_verifications`, which has no row-level security by design (ADR 0368 decision
 *          5), is listed as a platform table, as the strict audit requires.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The tests share one database and run in order.
 *           The container's superuser writes the null row, as row-level security never restricts it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, item 1); ADR 0347
 *                     (decisions 1 to 3 and 5).
 */
import { compileMigration, type CompiledMigration } from "@stackra/database";
import { assertRowSecurity, usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { tenantIsolationOptions } from "@stackra/tenancy/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateAchievementsMigration } from "#node/database/migrations/0001-create-achievements.migration";
import { AddAwardCodesAndUniqueGrantsMigration } from "#node/database/migrations/0002-add-award-codes-and-unique-grants.migration";
import { AddAchievementsTenancyMigration } from "#node/database/migrations/0003-add-achievements-tenancy.migration";
import { ContractAchievementsTenancyMigration } from "#node/database/migrations/0004-contract-achievements-tenancy.migration";

const TABLES = ["award_kinds", "awards"];

const postgres = usePostgres({
  entities: [],
  migrations: [
    CreateAchievementsMigration,
    AddAwardCodesAndUniqueGrantsMigration,
    AddAchievementsTenancyMigration,
  ].map((migration, index) =>
    compileMigration(migration, {
      schema: "achievements",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

const CONTRACT = compileMigration(ContractAchievementsTenancyMigration, {
  schema: "achievements",
  macros: [BelongsToTenantMacro],
});

/** Runs each step of `migration` in its own transaction, as the migration runner does. */
async function apply(migration: CompiledMigration): Promise<void> {
  const { database } = postgres;
  for (const step of migration.steps)
    await database.transaction(async () => {
      // raw-sql: the compiled migration's own statements
      for (const sql of step.sql) await database.em().execute(sql);
    });
}

/** Each contracted table's policies and whether `tenant_id` is NOT NULL. */
async function catalogue(): Promise<unknown[]> {
  // raw-sql: the catalogue's policies and NOT NULL flags of the contracted tables
  return postgres.database.em().execute(
    `select c.relname as "table", a.attnotnull as "notNull",
       array(select p.polname || ':' || case when p.polpermissive then 'permissive' else 'restrictive' end
             from pg_policy p where p.polrelid = c.oid order by p.polname) as policies
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id'
     where n.nspname = 'achievements' and c.relname in ('award_kinds', 'awards')
     order by c.relname`,
  );
}

describe("ContractAchievementsTenancyMigration on Postgres", () => {
  it("refuses while a row has no tenant, naming the count, and changes nothing", async () => {
    const before = await catalogue();
    const em = postgres.database.em();
    // raw-sql: an expand-step row written outside any tenant, so its tenant_id stayed null
    await em.execute(
      `insert into "achievements"."award_kinds" (id, scope_id, scope_path, key, name, recipient_model, is_once_per_period)
       values ('awk_01jab3k4m5n6p7q8r9s0t1v2w3', 'scp_01jab3k4m5n6p7q8r9s0t1v2w3', 'platform.acme', 'employee_of_month', 'Employee of the month', 'workforce.member', false)`,
    );
    try {
      await expect(apply(CONTRACT)).rejects.toThrow(
        /refused before any change: rows with a null tenant_id: achievements\.award_kinds 1\. Backfill tenant_id/,
      );
      expect(await catalogue()).toEqual(before);
    } finally {
      // raw-sql: removes the null row so the contract can apply
      await em.execute('delete from "achievements"."award_kinds"');
    }
  });

  it("applies on clean data: NOT NULL, the one equality and the scope path restrictive", async () => {
    await apply(CONTRACT);
    expect(await catalogue()).toEqual(
      [...TABLES].sort().map((table) => ({
        table,
        notNull: true,
        policies: [`pol_${table}_scope_path:restrictive`, `pol_${table}_tenant_id:permissive`],
      })),
    );
  });

  it("isolates each tenant's rows under assertRowSecurity, with no warning for these tables", async () => {
    const warnings = await assertRowSecurity(postgres.database, {
      ...tenantIsolationOptions(),
      platform: new Map([
        [
          "achievements.award_verifications",
          "ADR 0368 decision 5: a token hash, an award id and a scope, read before any tenant is known",
        ],
      ]),
    });
    expect(
      warnings.filter((warning) =>
        TABLES.some((table) => warning.startsWith(`achievements.${table} `)),
      ),
    ).toEqual([]);
  });
});
