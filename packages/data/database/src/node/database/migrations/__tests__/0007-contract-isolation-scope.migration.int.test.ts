/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractIsolationScopeMigration` on real Postgres, over the sequence and projection
 *          tables in their expand step (0001, 0004 and 0006): with a row whose `isolation_scope_id` is null the
 *          pre-flight refuses, naming the table's count, and changes nothing; on clean data it applies, each table has
 *          `isolation_scope_id` NOT NULL, `pol_<table>_isolation_scope_id` as its one permissive policy and the scope
 *          path restrictive, and `assertRowSecurity` audits the four tables by `isolation_scope_id` (group (b) by
 *          name): one isolation scope never sees, nor moves a row to, another's, with no warning.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The tests share one database and run in order.
 *           The container's superuser writes the null row, as row-level security never restricts it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, items 3 and 7); ADR 0347
 *                     (decisions 1 to 3 and 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMigration } from "#core/functions/compile-migration.function";
import type { CompiledMigration } from "#core/types/compiled-migration.type";
import { CreateSequenceTablesMigration } from "#node/database/migrations/0001-create-sequence-tables.migration";
import { CreateProjectionRowsMigration } from "#node/database/migrations/0004-create-projection-rows.migration";
import { AddIsolationScopeMigration } from "#node/database/migrations/0006-add-isolation-scope.migration";
import { ContractIsolationScopeMigration } from "#node/database/migrations/0007-contract-isolation-scope.migration";
import { assertRowSecurity } from "#testing/functions/assert-row-security.function";
import { usePostgres } from "#testing/use-postgres";

const TABLES = ["sequence_counters", "sequence_blocks", "sequence_voids", "projection_rows"];

const postgres = usePostgres({
  entities: [],
  migrations: [
    CreateSequenceTablesMigration,
    CreateProjectionRowsMigration,
    AddIsolationScopeMigration,
  ].map((migration, index) =>
    compileMigration(migration, { schema: "database", createsSchema: index === 0 }),
  ),
});

const CONTRACT = compileMigration(ContractIsolationScopeMigration, { schema: "database" });

/** Runs each step of `migration` in its own transaction, as the migration runner does. */
async function apply(migration: CompiledMigration): Promise<void> {
  const { database } = postgres;
  for (const step of migration.steps)
    await database.transaction(async () => {
      // raw-sql: the compiled migration's own statements
      for (const sql of step.sql) await database.em().execute(sql);
    });
}

/** Each table's policies and whether `isolation_scope_id` is NOT NULL. */
async function catalogue(): Promise<unknown[]> {
  // raw-sql: the catalogue's policies and NOT NULL flags of the four tables
  return postgres.database.em().execute(
    `select c.relname as "table", a.attnotnull as "notNull",
         array(select p.polname || ':' || case when p.polpermissive then 'permissive' else 'restrictive' end
               from pg_policy p where p.polrelid = c.oid order by p.polname) as policies
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       join pg_attribute a on a.attrelid = c.oid and a.attname = 'isolation_scope_id'
       where n.nspname = 'database'
       order by c.relname`,
  );
}

describe("ContractIsolationScopeMigration on Postgres", () => {
  it("refuses while a row has no isolation scope, naming the count, and changes nothing", async () => {
    const before = await catalogue();
    const em = postgres.database.em();
    // raw-sql: an expand-step row written outside any tenant, so its isolation_scope_id stayed null
    await em.execute(
      `insert into "database"."sequence_counters" (sequence_key, scope_id, scope_path, series, period)
       values ('orders.order', 'scp_01jab3k4m5n6p7q8r9s0t1v2w3', 'platform.acme', '[]', 0)`,
    );
    try {
      await expect(apply(CONTRACT)).rejects.toThrow(
        /refused before any change: rows with a null isolation_scope_id: database\.sequence_counters 1\. Backfill isolation_scope_id/,
      );
      expect(await catalogue()).toEqual(before);
    } finally {
      // raw-sql: removes the null row so the contract can apply
      await em.execute('delete from "database"."sequence_counters"');
    }
  });

  it("applies on clean data: NOT NULL, the one equality and the scope path restrictive", async () => {
    await apply(CONTRACT);
    expect(await catalogue()).toEqual(
      [...TABLES].sort().map((table) => ({
        table,
        notNull: true,
        policies: [
          `pol_${table}_isolation_scope_id:permissive`,
          `pol_${table}_scope_path:restrictive`,
        ],
      })),
    );
  });

  it("isolates each table by isolation_scope_id under assertRowSecurity, with no warning", async () => {
    const warnings = await assertRowSecurity(postgres.database, {
      column: "tenant_id",
      setting: "app.tenant_id",
      role: "stackra_app",
      probe: ["scp_01jab3k4m5n6p7q8r9s0t1v2w3", "scp_01jab3k4m5n6p7q8r9s0t1v2w4"],
      strict: true,
    });
    expect(warnings).toEqual([]);
  });
});
