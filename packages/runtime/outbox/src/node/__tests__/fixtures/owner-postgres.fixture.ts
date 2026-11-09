/**
 * Stackra file contract:
 * Purpose: the integration fixture of the outbox's row security on the testbed's Postgres: a fresh database per test
 *          file with the outbox migrations applied (all, or the first few so a test can seed rows first and apply the
 *          rest), a NOBYPASSRLS service role of its own that owns the outbox tables and executes their system functions
 *          (the shape a deployed service has), a unit of work as that role in one owner (`asService`), and a
 *          `CallIsolation` that runs each unit as that role with `app.tenant_id` set from the actor (`OwnerIsolation`),
 *          as the tenancy driver does, putting the enclosing owner back after a nested unit.
 * Boundary: test only; used by the `.int` files, skipped without `TESTBED_POSTGRES_HOST` (user `postgres`, a
 *           superuser, with trust auth). Migrations run as that superuser, as a migrator would, and the service role is
 *           then given the tables and the functions' EXECUTE; the system-access role is created first so concurrent
 *           files never race on it. Superuser statements (seeds, catalogue reads) bypass row security on purpose.
 *           Outbox cannot import @stackra/tenancy (tenancy depends on scope, which depends on outbox), so the isolation
 *           here is the tenancy driver's behaviour, not its code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (integration tier); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0495;
 *                     `.agents/rules/tenancy.md` (point 8).
 */
import { randomUUID } from "node:crypto";

import { CallIsolation } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { compileMigration } from "@stackra/database";
import type { CompiledMigration } from "@stackra/database";
import { PostgresDatabaseDriver } from "@stackra/database/node";

import { CreateMessagesMigration } from "#node/database/migrations/0001-create-messages.migration";
import { CreateInboxMigration } from "#node/database/migrations/0002-create-inbox.migration";
import { CreateOfflineStoresMigration } from "#node/database/migrations/0003-create-offline-stores.migration";
import { CreateChangesMigration } from "#node/database/migrations/0004-create-changes.migration";
import { CreateDeliveriesMigration } from "#node/database/migrations/0005-create-deliveries.migration";
import { ContractOutboxTenancyMigration } from "#node/database/migrations/0006-contract-outbox-tenancy.migration";

/** The testbed's throwaway Postgres; unset on the Mac and in plain CI, where the files are skipped. */
export const HOST = process.env["TESTBED_POSTGRES_HOST"];

/** The outbox migrations in apply order. */
const MIGRATIONS = [
  CreateMessagesMigration,
  CreateInboxMigration,
  CreateOfflineStoresMigration,
  CreateChangesMigration,
  CreateDeliveriesMigration,
  ContractOutboxTenancyMigration,
] as const;

/** Each outbox migration compiled, in apply order. */
export function outboxMigrations(): readonly CompiledMigration[] {
  return MIGRATIONS.map((migration, index) =>
    compileMigration(migration, { schema: "outbox", createsSchema: index === 0 }),
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
  /** Gives the service role the outbox tables, the schema and the functions, as a deployed service holds them. */
  readonly serve: () => Promise<void>;
  readonly close: () => Promise<void>;
}

/**
 * A fresh database with the first `through` outbox migrations applied (all by default) and, when all are, served.
 *
 * @example
 * const postgres = await ownerPostgres();
 */
export async function ownerPostgres(through: number = MIGRATIONS.length): Promise<OwnerPostgres> {
  const name = `outbox_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const role = `svc_${name}`;
  const admin = await PostgresDatabaseDriver.connect({ url: urlOf("postgres"), entities: [] });
  await admin.orm.schema.execute(`create database "${name}"`, { wrap: false });
  const database = await PostgresDatabaseDriver.connect({ url: urlOf(name), entities: [] });
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
      `grant usage, create on schema outbox to "${role}"`,
      `grant select, insert, update, delete on all tables in schema outbox to "${role}"`,
      `grant execute on all functions in schema outbox to "${role}"`,
      // the service role owns its tables (maintenance makes and drops partitions), so FORCE binds it too
      `do $$ declare t record; begin for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'outbox' and c.relkind in ('r', 'p') loop execute format('alter table outbox.%I owner to "${role}"', t.relname); end loop; end $$`,
    ])
      // raw-sql: the fixture's grants, as a superuser
      await em().execute(statement);
  };
  for (const migration of outboxMigrations().slice(0, through)) await apply(migration);
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
 * await asService(postgres, "scp_acme", () => driver.load(id));
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

/**
 * The tenancy driver's isolation, on the fixture's database: a unit (a savepoint inside a running transaction) as the
 * service role with `app.tenant_id` from `actor.scopeId`, the enclosing owner put back after it.
 */
export class OwnerIsolation extends Driver(CallIsolation) {
  /** The file's database and role. */
  private readonly postgres: OwnerPostgres;

  /**
   * @param postgres - the file's database and role.
   */
  constructor(postgres: OwnerPostgres) {
    super();
    this.postgres = postgres;
  }

  /** Implements `CallIsolation.run`, documented there; the scope is not used by the outbox's row work. */
  run<T>(
    actor: Actor,
    _scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: (actor?: Actor) => Promise<T>,
  ): Promise<T> {
    const { database, role } = this.postgres;
    return database.transaction(async () => {
      const em = database.em();
      // raw-sql: the role row-level security applies to
      await em.execute(`set local role "${role}"`);
      // raw-sql: the enclosing owner, put back after the unit as the tenancy driver does
      const [enclosing] = (await em.execute(
        "select coalesce(current_setting('app.tenant_id', true), '') as owner",
      )) as { owner: string }[];
      // raw-sql: the unit's owner
      await em.execute("select set_config('app.tenant_id', ?, true)", [actor.scopeId ?? ""]);
      const result = await work(actor);
      // raw-sql: the enclosing owner back; a unit that throws is rolled back to its savepoint, which puts it back
      await em.execute("select set_config('app.tenant_id', ?, true)", [enclosing?.owner ?? ""]);
      return result;
    });
  }
}
