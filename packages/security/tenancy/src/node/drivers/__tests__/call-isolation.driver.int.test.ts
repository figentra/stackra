/**
 * Stackra file contract:
 * Purpose: integration tests of tenant isolation on real Postgres through `CallIsolationDriver`: on a table made by
 *          `t.belongsToTenant()` (the forced equality policy), read and written as a role that is neither the owner nor
 *          `BYPASSRLS`, tenant A sees and writes only its own rows through `asTenant` and through the action pipeline
 *          (a query and an action); tenant B's rows are invisible, a row cannot be written into another tenant, a
 *          platform call sees none, a read-only call cannot write, a failed action leaves no row, and once the
 *          transaction ends the `app.tenant_id` setting is empty on the connection it used (ADR 0495).
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so each unit of work starts with `set local role stackra_probe`, as
 *           `assertRowSecurity` does; the role is created once with only table rights. The rows are seeded through
 *           `asTenant` itself, so the policy's `with check` is exercised on every write. Every statement reads
 *           `postgres.database.em()` inside the unit of work, where it is the running transaction's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0495 (decisions 1, 3 and 5); ADR 0239 (decision 1); ADR 0182 (integration tier); ADR 0022;
 *                     ADR 0269.
 */
import { Action, ActionPipeline, Query } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { AccessControl, CallIsolation, UnitOfWork } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { compileMigration, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { DatabaseUnitOfWorkDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { asTenant } from "#testing/functions/as-tenant.function";
import { tenantActor } from "#testing/functions/tenant-actor.function";

/** The tenant-owned table the tests use, made by the macro under test. */
class CreateTicketsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("tickets", (t: Blueprint) => {
      t.hasPublicId("tkt");
      t.belongsToTenant();
      t.string("title", 63).notNull().comment("What the ticket is about.");
    });
  }
}

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateTicketsMigration, {
      schema: "support",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

/** The role every unit of work runs as: no login, no `BYPASSRLS`, not the table's owner. */
const ROLE = "stackra_probe";

const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1";
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1";

const A1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2a1";
const A2 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2a2";
const B1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2b1";

/** Rows of one `select`. */
type Rows = readonly Record<string, unknown>[];

/** Runs `sql` in the running transaction as the probe role (the role ends with the transaction). */
async function probe(sql: string, params: readonly unknown[] = []): Promise<Rows> {
  const em = postgres.database.em();
  await em.execute(`set local role ${ROLE}`);
  return (await em.execute(sql, [...params])) as Rows;
}

/** Inserts one ticket owned by `tenant` as the probe role. */
const insert = (id: string, tenant: string, title = "t") =>
  probe('insert into "support"."tickets" (id, tenant_id, title) values (?, ?, ?)', [
    id,
    tenant,
    title,
  ]);

/** The ids of every ticket the probe role can see. */
const visible = async (): Promise<string[]> =>
  (await probe('select id from "support"."tickets" order by id')).map((row) => String(row.id));

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema "support" to ${ROLE}`);
  await em.execute(
    `grant select, insert, update, delete on all tables in schema "support" to ${ROLE}`,
  );
  await asTenant(TENANT_A, async () => {
    await insert(A1, TENANT_A, "a one");
    await insert(A2, TENANT_A, "a two");
  });
  await asTenant(TENANT_B, () => insert(B1, TENANT_B, "b one"));
});

describe("asTenant on Postgres", () => {
  it("shows tenant A only its own rows and tenant B only its own", async () => {
    expect(await asTenant(TENANT_A, visible)).toEqual([A1, A2]);
    expect(await asTenant(TENANT_B, visible)).toEqual([B1]);
  });

  it("shows a platform call no tenant row", async () => {
    expect(await asTenant(undefined, visible)).toEqual([]);
  });

  it("refuses a write into another tenant, and a write to another tenant's row changes nothing", async () => {
    await expect(
      asTenant(TENANT_A, () => insert("tkt_01j9z3k4m5n6p7q8r9s0t1v2a9", TENANT_B)),
    ).rejects.toThrow(/row-level security/i);
    const changed = await asTenant(TENANT_A, async () => {
      const em = postgres.database.em();
      await em.execute(`set local role ${ROLE}`);
      return (await em.execute(
        'update "support"."tickets" set title = ? where id = ?',
        ["taken", B1],
        "run",
      )) as { affectedRows?: number };
    });
    expect(changed.affectedRows ?? 0).toBe(0);
    expect(await asTenant(TENANT_B, () => probe('select title from "support"."tickets"'))).toEqual([
      { title: "b one" },
    ]);
  });

  it("leaves no tenant setting on the connection it used once the transaction ends", async () => {
    const used = await asTenant(TENANT_A, async () => {
      const [row] = (await postgres.database.em().execute("select pg_backend_pid() as pid")) as {
        pid: number;
      }[];
      return row?.pid;
    });
    // the pool hands the freed connection out again within a few statements, so look until the same backend answers
    let sameBackend = false;
    for (let attempt = 0; attempt < 100 && !sameBackend; attempt += 1) {
      const [row] = (await postgres.database
        .em()
        .execute(
          "select pg_backend_pid() as pid, current_setting('app.tenant_id', true) as tenant, " +
            "current_setting('app.scope_id', true) as scope",
        )) as { pid: number; tenant: string | null; scope: string | null }[];
      expect(row?.tenant ?? "").toBe("");
      expect(row?.scope ?? "").toBe("");
      sameBackend = row?.pid === used;
    }
    expect(sameBackend).toBe(true);
  });

  it("starts a read-only call read-only: a write inside it fails", async () => {
    await expect(
      asTenant(TENANT_A, () => insert("tkt_01j9z3k4m5n6p7q8r9s0t1v2a8", TENANT_A), {
        readOnly: true,
      }),
    ).rejects.toThrow(/read-only/i);
    expect(await asTenant(TENANT_A, visible)).toEqual([A1, A2]);
  });
});

/** Allows every call: the permission step is not what these tests prove. */
class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** Lists the caller's tickets. */
class ListTicketsQuery extends Query({
  key: "ticket.list",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<string[]> {
    return visible();
  }
}

/** Writes through a query, which runs read-only. */
class WriteFromQueryQuery extends Query({
  key: "ticket.sneak",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<void> {
    await insert("tkt_01j9z3k4m5n6p7q8r9s0t1v2a7", TENANT_A);
  }
}

/** Creates a ticket owned by the tenant its input names, then lists what the caller sees; `fail` throws after the write. */
class CreateTicketAction extends Action({
  key: "ticket.create",
  actors: [ActorKind.User],
}) {
  async handle(input: { id: string; tenant: string; fail?: boolean }): Promise<string[]> {
    await insert(input.id, input.tenant);
    if (input.fail === true) throw new Error("boom");
    return visible();
  }
}

/** A pipeline over the real isolation driver and unit of work. */
function pipelineOf(): ActionPipeline {
  const { database } = postgres;
  const bound = new Map<AnyClass, object>([
    [AccessControl, new AllowAll()],
    [UnitOfWork, new DatabaseUnitOfWorkDriver()],
    [CallIsolation, new CallIsolationDriver(database, new TenantIsolationService(database))],
    [ListTicketsQuery, new ListTicketsQuery()],
    [WriteFromQueryQuery, new WriteFromQueryQuery()],
    [CreateTicketAction, new CreateTicketAction()],
  ]);
  const resolver: Resolver = {
    has: (type) => bound.has(type),
    get: <U extends object>(type: AnyClass<U>) => bound.get(type) as U,
  };
  return new ActionPipeline(resolver);
}

/** A staff user acting in no tenant. */
const platform: Actor = { kind: ActorKind.User, id: tenantActor().id, realm: Realm.Staff };

/** What `actor` sees through the list query. */
const listAs = (actor: Actor) => pipelineOf().execute(ListTicketsQuery, {}, { actor });

describe("the action pipeline on Postgres", () => {
  it("lets a query see only its tenant's rows, and a platform query none", async () => {
    expect(await listAs(tenantActor(TENANT_A))).toEqual([A1, A2]);
    expect(await listAs(tenantActor(TENANT_B))).toEqual([B1]);
    expect(await listAs(platform)).toEqual([]);
  });

  it("runs a query read-only", async () => {
    await expect(
      pipelineOf().execute(WriteFromQueryQuery, {}, { actor: tenantActor(TENANT_A) }),
    ).rejects.toThrow(/read-only/i);
  });

  it("lets an action write only into its tenant, in its unit of work inside the isolation", async () => {
    const actor = tenantActor(TENANT_B);
    const b2 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2b2";
    expect(
      await pipelineOf().execute(CreateTicketAction, { id: b2, tenant: TENANT_B }, { actor }),
    ).toEqual([B1, b2]);
    // tenant A still sees only its own
    expect(await asTenant(TENANT_A, visible)).toEqual([A1, A2]);
    // a write into another tenant is refused by the policy
    await expect(
      pipelineOf().execute(
        CreateTicketAction,
        { id: "tkt_01j9z3k4m5n6p7q8r9s0t1v2b3", tenant: TENANT_A },
        { actor },
      ),
    ).rejects.toThrow(/row-level security/i);
  });

  it("leaves no row of an action that fails after writing", async () => {
    await expect(
      pipelineOf().execute(
        CreateTicketAction,
        { id: "tkt_01j9z3k4m5n6p7q8r9s0t1v2a6", tenant: TENANT_A, fail: true },
        { actor: tenantActor(TENANT_A) },
      ),
    ).rejects.toThrow("boom");
    expect(await asTenant(TENANT_A, visible)).toEqual([A1, A2]);
  });
});
