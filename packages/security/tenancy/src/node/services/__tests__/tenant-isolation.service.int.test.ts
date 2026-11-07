/**
 * Stackra file contract:
 * Purpose: integration tests of `TenantIsolationService.withTenant` on real Postgres over a pool of ONE connection, so
 *          every call shares one backend: after `withTenant(A)` returns or throws, the next transaction runs in no
 *          tenant and sees no tenant row; `withTenant(B)` then sees only B's rows; and a nested `withTenant` (a
 *          savepoint) puts the enclosing tenant back when it returns, throws or runs as the platform, while a write it
 *          left unflushed lands as its own tenant.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so each read runs as `stackra_probe` (`set local role`), as `assertRowSecurity`
 *           does; the rows are seeded as the superuser. The single-connection driver is this file's own, on the
 *           container `usePostgres` starts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0210 (decision 3); ADR 0239 (decision 1); ADR 0495; ADR 0182 (integration tier); ADR 0022.
 */
import { ActorKind } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { compileMigration, EntitySchema, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { PostgresDatabaseDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { tenantActor } from "#testing/functions/tenant-actor.function";

/** The tenant-owned table the tests read. */
class CreateTicketsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("tickets", (t: Blueprint) => {
      t.hasPublicId("tkt");
      t.belongsToTenant();
      t.string("title", 63).notNull().comment("What the ticket is about.");
    });
  }
}

/** A ticket row, written through the ORM so the savepoint's flush writes it. */
class Ticket {
  id!: string;

  tenantId!: string;

  title!: string;
}

const TicketSchema = new EntitySchema<Ticket>({
  class: Ticket,
  schema: "support",
  tableName: "tickets",
  properties: {
    id: { type: "string", primary: true, columnType: "varchar(33)" },
    tenantId: { type: "string", fieldName: "tenant_id", columnType: "varchar(33)" },
    title: { type: "string", columnType: "varchar(63)" },
  },
});

const postgres = usePostgres({
  entities: [TicketSchema],
  migrations: [
    compileMigration(CreateTicketsMigration, {
      schema: "support",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
  ],
});

/** The role every read runs as: no login, no `BYPASSRLS`, not the table's owner. */
const ROLE = "stackra_probe";

const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1";
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1";
const A1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2a1";
const B1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2b1";
const B2 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2b2";

/** A job acting in no tenant: a platform call. */
const PLATFORM: Actor = { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2p1" };

const state: { database?: PostgresDatabaseDriver; tenancy?: TenantIsolationService } = {};

/** The one-connection database. */
const single = (): PostgresDatabaseDriver => state.database as PostgresDatabaseDriver;

/** The service under test, over the one-connection database. */
const tenancy = (): TenantIsolationService => state.tenancy as TenantIsolationService;

/** The tickets the probe role sees, the tenant setting and the backend, read in the running transaction. */
async function look(): Promise<{ ids: string[]; tenant: string; pid: number }> {
  const em = single().em();
  await em.execute(`set local role ${ROLE}`);
  const rows = (await em.execute('select id from "support"."tickets" order by id')) as {
    id: string;
  }[];
  const [row] = (await em.execute(
    "select current_setting('app.tenant_id', true) as tenant, pg_backend_pid() as pid",
  )) as { tenant: string | null; pid: number }[];
  return { ids: rows.map(({ id }) => id), tenant: row?.tenant ?? "", pid: row?.pid ?? -1 };
}

/** What a transaction that enters no tenant sees on the connection. */
const outside = () => single().transaction(look);

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema "support" to ${ROLE}`);
  await em.execute(`grant select, insert on all tables in schema "support" to ${ROLE}`);
  await em.execute(
    'insert into "support"."tickets" (id, tenant_id, title) values (?, ?, ?), (?, ?, ?)',
    [A1, TENANT_A, "a", B1, TENANT_B, "b"],
  );
  state.database = await PostgresDatabaseDriver.connect({
    url: postgres.url,
    entities: [TicketSchema],
    pool: { min: 0, max: 1 },
  });
  state.tenancy = new TenantIsolationService(state.database);
});

afterAll(async () => {
  await state.database?.close();
});

describe("withTenant on one pooled connection", () => {
  it("leaves no tenant behind once it returns, and the next tenant sees only its own rows", async () => {
    const asA = await tenancy().withTenant(tenantActor(TENANT_A), look);
    expect(asA).toMatchObject({ ids: [A1], tenant: TENANT_A });
    const after = await outside();
    expect(after).toEqual({ ids: [], tenant: "", pid: asA.pid });
    const asB = await tenancy().withTenant(tenantActor(TENANT_B), look);
    expect(asB).toEqual({ ids: [B1], tenant: TENANT_B, pid: asA.pid });
  });

  it("leaves no tenant behind when the work throws", async () => {
    const failure = new Error("work failed");
    await expect(
      tenancy().withTenant(tenantActor(TENANT_A), async () => {
        await look();
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await outside()).toMatchObject({ ids: [], tenant: "" });
    expect(await tenancy().withTenant(tenantActor(TENANT_B), look)).toMatchObject({
      ids: [B1],
      tenant: TENANT_B,
    });
  });

  it("puts the enclosing tenant back after a nested call returns, throws or runs as the platform", async () => {
    const seen = await tenancy().withTenant(tenantActor(TENANT_A), async () => {
      const inner = await tenancy().withTenant(tenantActor(TENANT_B), look);
      const afterReturn = await look();
      await expect(
        tenancy().withTenant(tenantActor(TENANT_B), async () => {
          await look();
          throw new Error("inner failed");
        }),
      ).rejects.toThrow("inner failed");
      const afterThrow = await look();
      const platform = await tenancy().withTenant(PLATFORM, look);
      const afterPlatform = await look();
      return { inner, afterReturn, afterThrow, platform, afterPlatform };
    });
    expect(seen.inner).toMatchObject({ ids: [B1], tenant: TENANT_B });
    expect(seen.afterReturn).toMatchObject({ ids: [A1], tenant: TENANT_A });
    expect(seen.afterThrow).toMatchObject({ ids: [A1], tenant: TENANT_A });
    expect(seen.platform).toMatchObject({ ids: [], tenant: "" });
    expect(seen.afterPlatform).toMatchObject({ ids: [A1], tenant: TENANT_A });
    expect(await outside()).toMatchObject({ ids: [], tenant: "" });
  });

  it("writes a row a nested call left unflushed as the nested tenant, before the enclosing one is back", async () => {
    const after = await tenancy().withTenant(tenantActor(TENANT_A), async () => {
      await look();
      await tenancy().withTenant(tenantActor(TENANT_B), async () => {
        // left for the savepoint's flush, which must run as B: A's policy check refuses a B row
        const em = single().em();
        em.persist(em.create(Ticket, { id: B2, tenantId: TENANT_B, title: "b2" }));
      });
      return look();
    });
    expect(after).toMatchObject({ ids: [A1], tenant: TENANT_A });
    expect(await tenancy().withTenant(tenantActor(TENANT_B), look)).toMatchObject({
      ids: [B1, B2],
    });
  });
});
