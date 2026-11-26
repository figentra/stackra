/**
 * Stackra file contract:
 * Purpose: the integration fixture of the workflow journal's row security on the testbed's Postgres: a fresh database
 *          per test file with the workflow migrations applied (all, or the first few so a test can seed rows first and
 *          apply the rest), a NOBYPASSRLS service role of its own that the engine connects as (the shape a deployed
 *          service has: every transaction the journal opens, `requiresNew` ones included, is that role's), a unit of
 *          work as that role in one owner (`asService`), and a `CallIsolation` that sets `app.tenant_id` from the
 *          actor (`OwnerIsolation`), as the tenancy driver does, putting the enclosing owner back after a nested unit.
 * Boundary: test only; used by the `.int` files, skipped without `TESTBED_POSTGRES_HOST` (user `postgres`, a
 *           superuser, with trust auth for every role). Migrations run as that superuser, as a migrator would, and
 *           the service role is then given the schema, the tables and the functions' EXECUTE; the system-access role
 *           is created first so concurrent files never race on it. Superuser statements (seeds, catalogue reads)
 *           bypass row security on purpose. The isolation is the tenancy driver's behaviour, not its code: the actor's
 *           `scopeId` is the tenant, with no scope tree.
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
import { BelongsToTenantMacro } from "@stackra/tenancy/node";

import { CreateRunsMigration } from "#node/database/migrations/0001-create-runs.migration";
import { AddRunVersionMigration } from "#node/database/migrations/0002-add-run-version.migration";
import { CreateAutomationsMigration } from "#node/database/migrations/0003-create-automations.migration";
import { AddAutomationPublisherMigration } from "#node/database/migrations/0004-add-automation-publisher.migration";
import { CreateServiceAckSetsMigration } from "#node/database/migrations/0005-create-service-ack-sets.migration";
import { CreateChecklistsMigration } from "#node/database/migrations/0006-create-checklists.migration";
import { AddRunAutomationAndCancelMigration } from "#node/database/migrations/0007-add-run-automation-and-cancel.migration";
import { AddServiceAckKeptMigration } from "#node/database/migrations/0008-add-service-ack-kept.migration";
import { RenameChecklistProgressMigration } from "#node/database/migrations/0009-rename-checklist-progress.migration";
import { AddWorkflowTenancyMigration } from "#node/database/migrations/0010-add-workflow-tenancy.migration";
import { ContractWorkflowTenancyMigration } from "#node/database/migrations/0011-contract-workflow-tenancy.migration";
import { ContractJournalTenancyMigration } from "#node/database/migrations/0012-contract-journal-tenancy.migration";

/** The testbed's throwaway Postgres; unset on the Mac and in plain CI, where the files are skipped. */
export const HOST = process.env["TESTBED_POSTGRES_HOST"];

/** The workflow migrations in apply order. */
const MIGRATIONS = [
  CreateRunsMigration,
  AddRunVersionMigration,
  CreateAutomationsMigration,
  AddAutomationPublisherMigration,
  CreateServiceAckSetsMigration,
  CreateChecklistsMigration,
  AddRunAutomationAndCancelMigration,
  AddServiceAckKeptMigration,
  RenameChecklistProgressMigration,
  AddWorkflowTenancyMigration,
  ContractWorkflowTenancyMigration,
  ContractJournalTenancyMigration,
] as const;

/** Each workflow migration compiled, in apply order. */
export function workflowMigrations(): readonly CompiledMigration[] {
  return MIGRATIONS.map((migration, index) =>
    compileMigration(migration, {
      schema: "workflow",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  );
}

/** The connection string of database `name` on the testbed's Postgres, as `user`. */
function urlOf(name: string, user = "postgres"): string {
  return `postgres://${user}@${HOST ?? "localhost"}:5432/${name}`;
}

/** One file's database, its service role and how to close it. */
export interface OwnerPostgres {
  /** The superuser's connection: migrations, seeds and catalogue reads, past row security. */
  readonly database: PostgresDatabaseDriver;
  /** The service role's connection, which the engine and the journal run on (opened by `serve`). */
  readonly service: () => PostgresDatabaseDriver;
  /** The NOBYPASSRLS service role, unique to the file (roles are the cluster's). */
  readonly role: string;
  /** Applies compiled `migration` as the superuser, step by step; a refused step throws and changes nothing. */
  readonly apply: (migration: CompiledMigration) => Promise<void>;
  /** Gives the service role the schema, the tables and the functions, and connects as it. */
  readonly serve: () => Promise<void>;
  readonly close: () => Promise<void>;
}

/**
 * A fresh database with the first `through` workflow migrations applied (all by default) and, when all are, served.
 *
 * @example
 * const postgres = await ownerPostgres();
 */
export async function ownerPostgres(through: number = MIGRATIONS.length): Promise<OwnerPostgres> {
  const name = `workflow_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const role = `svc_${name}`;
  const admin = await PostgresDatabaseDriver.connect({ url: urlOf("postgres"), entities: [] });
  await admin.orm.schema.execute(`create database "${name}"`, { wrap: false });
  const database = await PostgresDatabaseDriver.connect({ url: urlOf(name), entities: [] });
  const em = () => database.em();
  // raw-sql: the file's service role and the shared system-access role, created once whatever another file does
  await em().execute(`create role "${role}" login nobypassrls`);
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
  let service: PostgresDatabaseDriver | undefined;
  const serve = async () => {
    for (const statement of [
      `grant usage on schema workflow to "${role}"`,
      `grant select, insert, update, delete on all tables in schema workflow to "${role}"`,
      `grant execute on all functions in schema workflow to "${role}"`,
      // the service role owns its tables, so FORCE binds it too
      `do $$ declare t record; begin for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'workflow' and c.relkind in ('r', 'p') loop execute format('alter table workflow.%I owner to "${role}"', t.relname); end loop; end $$`,
    ])
      // raw-sql: the fixture's grants, as a superuser
      await em().execute(statement);
    service = await PostgresDatabaseDriver.connect({ url: urlOf(name, role), entities: [] });
  };
  for (const migration of workflowMigrations().slice(0, through)) await apply(migration);
  if (through === MIGRATIONS.length) await serve();
  return {
    database,
    service: () => {
      if (service === undefined) throw new Error("serve() first");
      return service;
    },
    role,
    apply,
    serve,
    close: async () => {
      await service?.close();
      await database.close();
      await admin.close();
    },
  };
}

/**
 * Runs `work` in one transaction as the service role, with `app.tenant_id` set to `owner` ('' or undefined: none).
 *
 * @example
 * await asService(postgres, "scp_acme", () => runner.start(OrderWorkflow, input, origin));
 */
export function asService<T>(
  postgres: OwnerPostgres,
  owner: string | undefined,
  work: () => Promise<T>,
): Promise<T> {
  const database = postgres.service();
  return database.transaction(async () => {
    // raw-sql: the owner setting, as the isolation writes it, for this transaction only
    await database.em().execute("select set_config('app.tenant_id', ?, true)", [owner ?? ""]);
    return work();
  });
}

/**
 * The tenancy driver's isolation, on the service role's connection: a unit (a savepoint inside a running transaction)
 * with `app.tenant_id` from `actor.scopeId`, the enclosing owner put back after it. Like the driver, it refuses a unit
 * whose owner would replace another the running transaction holds.
 */
export class OwnerIsolation extends Driver(CallIsolation) {
  /** The file's database and role. */
  private readonly postgres: OwnerPostgres;

  /** Every actor a unit ran as, in order. */
  readonly actors: Actor[] = [];

  /**
   * @param postgres - the file's database and role.
   */
  constructor(postgres: OwnerPostgres) {
    super();
    this.postgres = postgres;
  }

  /** Implements `CallIsolation.run`, documented there; the scope is not used by the journal's row work. */
  run<T>(
    actor: Actor,
    _scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: (actor?: Actor) => Promise<T>,
  ): Promise<T> {
    this.actors.push(actor);
    const database = this.postgres.service();
    return database.transaction(async () => {
      const em = database.em();
      // raw-sql: the enclosing owner, put back after the unit as the tenancy driver does
      const [enclosing] = (await em.execute(
        "select coalesce(current_setting('app.tenant_id', true), '') as owner",
      )) as { owner: string }[];
      const held = enclosing?.owner ?? "";
      if (held !== "" && held !== (actor.scopeId ?? ""))
        throw new Error(`a unit of ${actor.scopeId ?? "no owner"} inside one of ${held}`);
      // raw-sql: the unit's owner
      await em.execute("select set_config('app.tenant_id', ?, true)", [actor.scopeId ?? ""]);
      const result = await work(actor);
      // raw-sql: the enclosing owner back; a unit that throws is rolled back to its savepoint, which puts it back
      await em.execute("select set_config('app.tenant_id', ?, true)", [held]);
      return result;
    });
  }
}
