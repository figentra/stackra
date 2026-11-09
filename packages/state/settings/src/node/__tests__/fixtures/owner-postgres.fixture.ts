/**
 * Stackra file contract:
 * Purpose: the integration fixture of the settings tables' row security on the testbed's Postgres: a fresh database per
 *          test file with the settings migrations applied (all, or the first few so a test can seed rows first and
 *          apply the rest), a NOBYPASSRLS service role of its own that owns the settings tables and executes their
 *          system functions (the shape a deployed service has), and a unit of work as that role in one owner
 *          (`asService`), as the tenancy driver's isolation sets it.
 * Boundary: test only; used by the `.int` files, skipped without `TESTBED_POSTGRES_HOST` (user `postgres`, a
 *           superuser, with trust auth). Migrations run as that superuser, as a migrator would, and the service role is
 *           then given the tables and the functions' EXECUTE; the system-access role is created first so concurrent
 *           files never race on it. Superuser statements (seeds, catalogue reads) bypass row security on purpose. The
 *           settings entities are registered, so `StoredSettingService` runs on the file's database. Settings does not
 *           depend on @stackra/tenancy, so the owner setting here is the tenancy driver's behaviour, not its code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, gaps A and C);
 *                     `.agents/rules/tenancy.md` (point 8).
 */
import { randomUUID } from "node:crypto";

import { compileMigration } from "@stackra/database";
import type { CompiledMigration } from "@stackra/database";
import { PostgresDatabaseDriver } from "@stackra/database/node";

import { CreateStoredSettingsMigration } from "#node/database/migrations/0001-create-stored-settings.migration";
import { CreateStoredSettingRevisionsMigration } from "#node/database/migrations/0002-create-stored-setting-revisions.migration";
import { AddSettingRevisionApprovalRoleMigration } from "#node/database/migrations/0003-add-setting-revision-approval-role.migration";
import { ContractSettingsTenancyMigration } from "#node/database/migrations/0004-contract-settings-tenancy.migration";
import { SETTINGS_ENTITIES } from "#node/entities.gen";

/** The testbed's throwaway Postgres; unset on the Mac and in plain CI, where the files are skipped. */
export const HOST = process.env["TESTBED_POSTGRES_HOST"];

/** The settings migrations in apply order. */
const MIGRATIONS = [
  CreateStoredSettingsMigration,
  CreateStoredSettingRevisionsMigration,
  AddSettingRevisionApprovalRoleMigration,
  ContractSettingsTenancyMigration,
] as const;

/** Each settings migration compiled, in apply order. */
export function settingsMigrations(): readonly CompiledMigration[] {
  return MIGRATIONS.map((migration, index) =>
    compileMigration(migration, { schema: "settings", createsSchema: index === 0 }),
  );
}

/** The connection string of database `name` on the testbed's Postgres. */
function urlOf(name: string, user = "postgres"): string {
  return `postgres://${user}@${HOST ?? "localhost"}:5432/${name}`;
}

/** One file's database, its service role and how to close it. */
export interface OwnerPostgres {
  readonly database: PostgresDatabaseDriver;
  /** The file's database's connection string as `user`, for code that connects on its own (the CLI runner). */
  readonly urlAs: (user: string) => string;
  /** The NOBYPASSRLS service role, unique to the file (roles are the cluster's). */
  readonly role: string;
  /** Applies compiled `migration` as the superuser, step by step; a refused step throws and changes nothing. */
  readonly apply: (migration: CompiledMigration) => Promise<void>;
  /** Gives the service role the settings tables, the schema and the functions, as a deployed service holds them. */
  readonly serve: () => Promise<void>;
  readonly close: () => Promise<void>;
}

/**
 * A fresh database with the first `through` settings migrations applied (all by default) and, when all are, served.
 *
 * @example
 * const postgres = await ownerPostgres();
 */
export async function ownerPostgres(through: number = MIGRATIONS.length): Promise<OwnerPostgres> {
  const name = `settings_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const role = `svc_${name}`;
  const admin = await PostgresDatabaseDriver.connect({ url: urlOf("postgres"), entities: [] });
  await admin.orm.schema.execute(`create database "${name}"`, { wrap: false });
  const database = await PostgresDatabaseDriver.connect({
    url: urlOf(name),
    entities: [...SETTINGS_ENTITIES],
  });
  const em = () => database.em();
  // raw-sql: the file's service role and the shared system-access role, created once whatever another file does
  await em().execute(`create role "${role}" nologin nobypassrls`);
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
      `grant usage on schema settings to "${role}"`,
      `grant select, insert, update, delete on all tables in schema settings to "${role}"`,
      `grant execute on all functions in schema settings to "${role}"`,
      // the service role owns its tables, so FORCE binds it too
      `do $$ declare t record; begin for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'settings' and c.relkind = 'r' loop execute format('alter table settings.%I owner to "${role}"', t.relname); end loop; end $$`,
    ])
      // raw-sql: the fixture's grants, as a superuser
      await em().execute(statement);
  };
  for (const migration of settingsMigrations().slice(0, through)) await apply(migration);
  if (through === MIGRATIONS.length) await serve();
  return {
    database,
    urlAs: (user) => urlOf(name, user),
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
 * await asService(postgres, "scp_acme", () => store.layers("orders", { scope }));
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
