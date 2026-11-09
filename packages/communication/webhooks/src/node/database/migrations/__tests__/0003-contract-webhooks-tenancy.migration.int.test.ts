/**
 * Stackra file contract:
 * Purpose: integration tests of `ContractWebhooksTenancyMigration` on real Postgres, over the two webhooks migrations
 *          before it: with an endpoint at a product node, one below a tenant node and a delivery of the first, the
 *          pre-flight refuses, naming each table's count, and changes nothing (no `tenant_id` column is left); with
 *          those rows gone it applies, an endpoint at a top-level tenant node and its delivery take that node as their
 *          tenant, each table has `tenant_id` NOT NULL with the `app.tenant_id` default and `pol_<table>_tenant_id` as
 *          its one policy, and `assertRowSecurity` passes in strict mode.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The tests share one database and run in order.
 *           The rows are written as the container's superuser, which row security never restricts.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (decision 1; 2026-11-07 amendment, group (c));
 *                     ADR 0347 (decisions 1, 2 and 5).
 */
import { compileMigration, type CompiledMigration } from "@stackra/database";
import { assertRowSecurity, usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { tenantIsolationOptions } from "@stackra/tenancy/testing";
import { describe, expect, it } from "@stackra/testing";

import { CreateWebhookEndpointsMigration } from "#node/database/migrations/0001-create-webhook-endpoints.migration";
import { CreateWebhookDeliveriesMigration } from "#node/database/migrations/0002-create-webhook-deliveries.migration";
import { ContractWebhooksTenancyMigration } from "#node/database/migrations/0003-contract-webhooks-tenancy.migration";

const postgres = usePostgres({
  entities: [],
  migrations: [CreateWebhookEndpointsMigration, CreateWebhookDeliveriesMigration].map(
    (migration, index) =>
      compileMigration(migration, { schema: "webhooks", createsSchema: index === 0 }),
  ),
});

const CONTRACT = compileMigration(ContractWebhooksTenancyMigration, {
  schema: "webhooks",
  macros: [BelongsToTenantMacro],
});

/** A top-level tenant node, right under the product. */
const TOP_NODE = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2t1", path: "platform.acme.shop" };

/** Runs each step of `migration` as the runner does: a transactional one in a transaction, an online one alone. */
async function apply(migration: CompiledMigration): Promise<void> {
  const { database } = postgres;
  for (const step of migration.steps) {
    // raw-sql: the compiled migration's own statements
    const run = async () => {
      for (const sql of step.sql) await database.em().execute(sql);
    };
    await (step.transactional ? database.transaction(run) : run());
  }
}

/** Stores an endpoint `id` at the scope node `scope`, as the superuser. */
async function endpoint(id: string, scope: { id: string; path: string }): Promise<void> {
  // raw-sql: a row written before tenancy, with no tenant column yet
  await postgres.database
    .em()
    .execute(
      `insert into "webhooks"."webhook_endpoints" (id, scope_id, scope_path, url, events, secret_name) values (?, ?, ?, 'https://hooks.acme.example/in', '["orders.order.paid.v1"]', 'ACME_WEBHOOK_SECRET')`,
      [id, scope.id, scope.path],
    );
}

/** Stores a delivery `id` to endpoint `endpointId` at `scope`, as the superuser. */
async function delivery(
  id: string,
  endpointId: string,
  scope: { id: string; path: string },
): Promise<void> {
  // raw-sql: a row written before tenancy, with no tenant column yet
  await postgres.database
    .em()
    .execute(
      `insert into "webhooks"."webhook_deliveries" (id, endpoint_id, scope_id, scope_path, event_id, event_type, is_delivered) values (?, ?, ?, ?, 'evt_1', 'orders.order.paid.v1', true)`,
      [id, endpointId, scope.id, scope.path],
    );
}

/** Each table's tenant column: NOT NULL, its default and its policies; none while the column is absent. */
async function catalogue(): Promise<unknown[]> {
  // raw-sql: the catalogue's tenant column and policies of the two tables
  return postgres.database.em().execute(
    `select c.relname as "table", a.attnotnull as "notNull", pg_get_expr(d.adbin, d.adrelid) as "default",
       c.relrowsecurity as "enabled", c.relforcerowsecurity as "forced",
       array(select p.polname || ':' || case when p.polpermissive then 'permissive' else 'restrictive' end
             from pg_policy p where p.polrelid = c.oid order by p.polname) as policies
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     join pg_attribute a on a.attrelid = c.oid and a.attname = 'tenant_id' and not a.attisdropped
     left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
     where n.nspname = 'webhooks' and c.relkind = 'r'
     order by c.relname`,
  );
}

describe("ContractWebhooksTenancyMigration on Postgres", () => {
  it("refuses while a row's tenant cannot be read, naming each table's count, and changes nothing", async () => {
    await endpoint("whe_01jab3k4m5n6p7q8r9s0t1v2p1", {
      id: "scp_01jab3k4m5n6p7q8r9s0t1v2p1",
      path: "platform.acme",
    });
    await endpoint("whe_01jab3k4m5n6p7q8r9s0t1v2b1", {
      id: "scp_01jab3k4m5n6p7q8r9s0t1v2b1",
      path: "platform.acme.shop.downtown",
    });
    await delivery("whd_01jab3k4m5n6p7q8r9s0t1v2p1", "whe_01jab3k4m5n6p7q8r9s0t1v2p1", {
      id: "scp_01jab3k4m5n6p7q8r9s0t1v2p1",
      path: "platform.acme",
    });
    await endpoint("whe_01jab3k4m5n6p7q8r9s0t1v2t1", TOP_NODE);
    await delivery("whd_01jab3k4m5n6p7q8r9s0t1v2t1", "whe_01jab3k4m5n6p7q8r9s0t1v2t1", TOP_NODE);
    await expect(apply(CONTRACT)).rejects.toThrow(
      /refused before any change: rows with a null tenant_id: webhooks\.webhook_endpoints 2, webhooks\.webhook_deliveries 1\. An endpoint above or below a top-level tenant node/,
    );
    expect(await catalogue()).toEqual([]);
  });

  it("applies once those rows are gone: the tenant node's rows take it, NOT NULL under the one equality", async () => {
    // raw-sql: removes the endpoints whose tenant cannot be read; their deliveries cascade
    await postgres.database
      .em()
      .execute(
        `delete from "webhooks"."webhook_endpoints" where id in ('whe_01jab3k4m5n6p7q8r9s0t1v2p1', 'whe_01jab3k4m5n6p7q8r9s0t1v2b1')`,
      );
    await apply(CONTRACT);
    expect(
      // raw-sql: the backfilled tenants of both tables
      await postgres.database
        .em()
        .execute(
          `select id, tenant_id from "webhooks"."webhook_endpoints" union all select id, tenant_id from "webhooks"."webhook_deliveries" order by id`,
        ),
    ).toEqual([
      { id: "whd_01jab3k4m5n6p7q8r9s0t1v2t1", tenant_id: TOP_NODE.id },
      { id: "whe_01jab3k4m5n6p7q8r9s0t1v2t1", tenant_id: TOP_NODE.id },
    ]);
    expect(await catalogue()).toEqual(
      ["webhook_deliveries", "webhook_endpoints"].map((table) => ({
        table,
        notNull: true,
        default: expect.stringContaining("current_setting('app.tenant_id'"),
        enabled: true,
        forced: true,
        policies: [`pol_${table}_tenant_id:permissive`],
      })),
    );
  });

  it("passes assertRowSecurity in strict mode", async () => {
    await expect(
      assertRowSecurity(postgres.database, { ...tenantIsolationOptions(), strict: true }),
    ).resolves.toEqual([]);
  });
});
