/**
 * Stackra file contract:
 * Purpose: the integration fixture of the index registry's row security on the testbed's Postgres: a fresh database
 *          per test file with the registry's migrations applied (all, or the first few so a test can seed rows first
 *          and apply the rest), a NOBYPASSRLS service role of its own that owns `search.indexes` and executes the
 *          system functions (the shape a deployed service has), and a unit of work as that role in one owner
 *          (`asService`), as the tenancy driver's isolation sets it.
 * Boundary: test only; used by the `.int` files, skipped without `TESTBED_POSTGRES_HOST` (user `postgres`, a
 *           superuser, with trust auth). Migrations run as that superuser, as a migrator would, and the service role is
 *           then given the tables and the functions' EXECUTE; the system-access role is created first so concurrent
 *           files never race on it. Superuser statements (seeds, catalogue reads) bypass row security on purpose. Only
 *           the registry's own migrations run (0005, 0006 and 0010, with `ltree`), so the vector and text tables and
 *           their extensions are not needed; the owner setting here is the tenancy driver's behaviour.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, gaps A and C);
 *                     `.agents/rules/tenancy.md` (point 8).
 */
import { randomUUID } from "node:crypto";

import { compileMigration } from "@stackra/database";
import type { CompiledMigration } from "@stackra/database";
import { PostgresDatabaseDriver } from "@stackra/database/node";

import { CreateSearchIndexesMigration } from "#node/database/migrations/0005-create-search-indexes.migration";
import { AddSearchIndexVersionMigration } from "#node/database/migrations/0006-add-search-index-version.migration";
import { ContractSearchIndexTenancyMigration } from "#node/database/migrations/0010-contract-search-index-tenancy.migration";

/** The testbed's throwaway Postgres; unset on the Mac and in plain CI, where the files are skipped. */
export const HOST = process.env["TESTBED_POSTGRES_HOST"];

/** The registry's migrations in apply order. */
const MIGRATIONS = [
  CreateSearchIndexesMigration,
  AddSearchIndexVersionMigration,
  ContractSearchIndexTenancyMigration,
] as const;

/** Each registry migration compiled, in apply order. */
export function registryMigrations(): readonly CompiledMigration[] {
  return MIGRATIONS.map((migration, index) =>
    compileMigration(migration, { schema: "search", createsSchema: index === 0 }),
  );
}

/** The connection string of database `name` on the testbed's Postgres. */
function urlOf(name: string): string {
  return `postgres://postgres@${HOST ?? "localhost"}:5432/${name}`;
}

/** One file's database, its service role and how to close it. */
export interface OwnerPostgres {
  readonly database: PostgresDatabaseDriver;
  /** The NOBYPASSRLS service role, unique to the file (roles are the cluster's). */
  readonly role: string;
  /** Applies compiled `migration` as the superuser, step by step; a refused step throws and changes nothing. */
  readonly apply: (migration: CompiledMigration) => Promise<void>;
  /** Gives the service role the registry, the schema and the functions, as a deployed service holds them. */
  readonly serve: () => Promise<void>;
  readonly close: () => Promise<void>;
}

/**
 * A fresh database with the first `through` registry migrations applied (all by default) and, when all are, served.
 *
 * @example
 * const postgres = await ownerPostgres();
 */
export async function ownerPostgres(through: number = MIGRATIONS.length): Promise<OwnerPostgres> {
  const name = `search_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const role = `svc_${name}`;
  const admin = await PostgresDatabaseDriver.connect({ url: urlOf("postgres"), entities: [] });
  await admin.orm.schema.execute(`create database "${name}"`, { wrap: false });
  const database = await PostgresDatabaseDriver.connect({ url: urlOf(name), entities: [] });
  const em = () => database.em();
  // raw-sql: the file's service role and the shared system-access role, created once whatever another file does
  await em().execute(`create role "${role}" nologin nobypassrls`);
  // raw-sql: the extension the registry's backfill reads paths with
  await em().execute("create extension if not exists ltree");
  await em().execute(
    [
      "do $$",
      "begin",
      "  create role stackra_system_access nologin nobypassrls;",
      "exception when duplicate_object or unique_violation then null;",
      "end",
      "$$",
    ].join("\n"),
  );
  const apply = async (migration: CompiledMigration) => {
    for (const step of migration.steps)
      await database.orm.schema.execute(step.sql.join(";\n"), { wrap: step.transactional });
  };
  const serve = async () => {
    for (const statement of [
      `grant usage on schema search to "${role}"`,
      `grant select, insert, update, delete on all tables in schema search to "${role}"`,
      `grant execute on all functions in schema search to "${role}"`,
      // the service role owns its tables, so FORCE binds it too
      `do $$ declare t record; begin for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'search' and c.relkind = 'r' loop execute format('alter table search.%I owner to "${role}"', t.relname); end loop; end $$`,
    ])
      // raw-sql: the fixture's grants, as a superuser
      await em().execute(statement);
  };
  for (const migration of registryMigrations().slice(0, through)) await apply(migration);
  if (through === MIGRATIONS.length) await serve();
  return {
    database,
    role,
    apply,
    serve,
    close: async () => {
      await database.close();
      await admin.close();
    },
  };
}

/**
 * Runs `work` in one transaction as `role`, with `app.tenant_id` set to `owner` ('' or undefined: no owner).
 *
 * @example
 * await asService(postgres, "scp_acme", () => registry.finish("Product", undefined, 3));
 */
export function asService<T>(
  postgres: OwnerPostgres,
  owner: string | undefined,
  work: () => Promise<T>,
): Promise<T> {
  const { database, role } = postgres;
  return database.transaction(async () => {
    // raw-sql: the role row-level security applies to, for this transaction only
    await database.em().execute(`set local role "${role}"`);
    // raw-sql: the owner setting, as the isolation writes it, for this transaction only
    await database.em().execute("select set_config('app.tenant_id', ?, true)", [owner ?? ""]);
    return work();
  });
}
