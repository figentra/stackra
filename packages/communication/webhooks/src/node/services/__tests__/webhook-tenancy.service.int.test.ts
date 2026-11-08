/**
 * Stackra file contract:
 * Purpose: integration tests of the webhooks services under the tenant form on real Postgres, connected as a role that
 *          row security binds: tenant B cannot list, read, rotate, disable, update or delete tenant A's endpoint, nor
 *          list or delete its delivery; `WebhookDeliveryService.record` (a `requiresNew` insert, on another backend)
 *          inside tenant A stores a row of tenant A that stays when the outer transaction rolls back; and a write with
 *          no tenant is refused.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. Every service call runs through `asTenant`, the
 *           same `CallIsolationDriver` the pipeline and the queue use, on a second connection as `webhooks_app` (a login
 *           role without `BYPASSRLS` that does not own the tables), so a `requiresNew` backend is bound too; the stored
 *           tenant is read back as the container's superuser. The tests share one database and run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0182 (integration tier); ADR 0239 (decision 1); ADR 0495; ADR 0136 (decision 2);
 *                     ADR 0224 (decision 3); `.agents/rules/tenancy.md` (point 7).
 */
import type { PublicId, ScopeRef } from "@stackra/contracts";
import { compileMigration, registerModelPartners } from "@stackra/database";
import { PostgresDatabaseDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { BelongsToTenantMacro } from "@stackra/tenancy/node";
import { asTenant, fakeTenantId } from "@stackra/tenancy/testing";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { CreateWebhookEndpointsMigration } from "#node/database/migrations/0001-create-webhook-endpoints.migration";
import { CreateWebhookDeliveriesMigration } from "#node/database/migrations/0002-create-webhook-deliveries.migration";
import { ContractWebhooksTenancyMigration } from "#node/database/migrations/0003-contract-webhooks-tenancy.migration";
import { WEBHOOKS_ENTITIES } from "#node/entities.gen";
import { WebhookDelivery } from "#node/models/webhook-delivery.model";
import { WebhookEndpoint } from "#node/models/webhook-endpoint.model";
import { WebhookDeliveryService } from "#node/services/webhook-delivery.service";
import { WebhookEndpointService } from "#node/services/webhook-endpoint.service";

registerModelPartners([
  [WebhookEndpointService, WebhookEndpoint],
  [WebhookDeliveryService, WebhookDelivery],
]);

const postgres = usePostgres({
  entities: WEBHOOKS_ENTITIES,
  migrations: [
    CreateWebhookEndpointsMigration,
    CreateWebhookDeliveriesMigration,
    ContractWebhooksTenancyMigration,
  ].map((migration, index) =>
    compileMigration(migration, {
      schema: "webhooks",
      createsSchema: index === 0,
      macros: [BelongsToTenantMacro],
    }),
  ),
});

/** The role the services run as: it logs in, has no `BYPASSRLS` and does not own the tables. */
const ROLE = "webhooks_app";

const A = fakeTenantId();
const B = fakeTenantId();
const SCOPE_A: ScopeRef = { id: A, path: "platform.acme.shop" };
const EVENT = "orders.order.paid.v1";

const state: { app?: PostgresDatabaseDriver; endpointId?: PublicId<"whe"> } = {};

/** The endpoint tenant A registered in the first test. */
const endpointId = (): PublicId<"whe"> => state.endpointId as PublicId<"whe">;

/** An attempt of A's endpoint. */
const attempt = (eventId: string) => ({
  endpointId: endpointId(),
  scopeId: A,
  scopePath: SCOPE_A.path,
  eventId,
  eventType: EVENT,
  responseStatus: 500,
  isDelivered: false,
});

/** The stored tenant of each row of `table`, read as the superuser. */
async function stored(table: "webhook_endpoints" | "webhook_deliveries"): Promise<unknown[]> {
  // raw-sql: the stored tenants, past row security
  return postgres.database
    .em()
    .execute(`select id, tenant_id from "webhooks"."${table}" order by id`);
}

beforeAll(async () => {
  const em = postgres.database.em();
  // raw-sql: the service role, so row security binds every connection the services open
  await em.execute(`create role ${ROLE} login password '${ROLE}' nobypassrls`);
  await em.execute(`grant usage on schema "webhooks" to ${ROLE}`);
  await em.execute(
    `grant select, insert, update, delete on all tables in schema "webhooks" to ${ROLE}`,
  );
  const url = new URL(postgres.url);
  url.username = ROLE;
  url.password = ROLE;
  // connected last, so it is `Database.current()` for the services and `asTenant`
  state.app = await PostgresDatabaseDriver.connect({
    url: url.toString(),
    entities: WEBHOOKS_ENTITIES,
  });
});

afterAll(async () => {
  await state.app?.close();
});

describe("the webhooks services under the tenant form", () => {
  it("stores an endpoint in the calling tenant", async () => {
    const endpoint = await asTenant(A, () =>
      new WebhookEndpointService().register({
        scope: SCOPE_A,
        url: "https://hooks.acme.example/in",
        events: [EVENT],
        secretName: "ACME_WEBHOOK_SECRET",
      }),
    );
    state.endpointId = endpoint.id;
    expect(await stored("webhook_endpoints")).toEqual([{ id: endpoint.id, tenant_id: A }]);
    expect(
      (await asTenant(A, () => new WebhookEndpointService().subscribedTo(A, EVENT))).map(
        (found) => found.id,
      ),
    ).toEqual([endpoint.id]);
  });

  it("keeps a requiresNew attempt of tenant A when the outer transaction rolls back", async () => {
    const rolledBack = new Error("delivery failed");
    await expect(
      asTenant(A, async () => {
        await new WebhookDeliveryService().record(attempt("evt_rolled_back"));
        throw rolledBack;
      }),
    ).rejects.toBe(rolledBack);
    expect(await stored("webhook_deliveries")).toEqual([{ id: expect.any(String), tenant_id: A }]);
    expect(
      (await asTenant(A, () => new WebhookDeliveryService().find({}))).map((row) => row.eventId),
    ).toEqual(["evt_rolled_back"]);
  });

  it("shows tenant B none of A's endpoints and lets it change or delete none", async () => {
    const id = endpointId();
    await asTenant(B, async () => {
      const endpoints = new WebhookEndpointService();
      expect(await endpoints.find({})).toEqual([]);
      expect(await endpoints.findOne({ id })).toBeNull();
      expect(await endpoints.subscribedTo(A, EVENT)).toEqual([]);
      await expect(endpoints.rotate(id, "B_SECRET", new Date())).rejects.toThrow();
      await endpoints.disable(id, new Date());
      expect(await endpoints.updateWhere({ id }, { url: "https://hooks.globex.example/in" })).toBe(
        0,
      );
      expect(await endpoints.deleteWhere({ id })).toBe(0);
    });
    const kept = await asTenant(A, () => new WebhookEndpointService().findOneOrFail({ id }));
    expect(kept).toMatchObject({
      url: "https://hooks.acme.example/in",
      secretName: "ACME_WEBHOOK_SECRET",
      disabledAt: null,
    });
  });

  it("shows tenant B none of A's deliveries and lets it delete none", async () => {
    await asTenant(B, async () => {
      const deliveries = new WebhookDeliveryService();
      expect(await deliveries.find({})).toEqual([]);
      expect(await deliveries.deleteWhere({ endpointId: endpointId() })).toBe(0);
    });
    expect(await stored("webhook_deliveries")).toHaveLength(1);
  });

  it("refuses an endpoint or an attempt written with no tenant", async () => {
    await expect(
      asTenant(undefined, () =>
        new WebhookEndpointService().register({
          scope: SCOPE_A,
          url: "https://hooks.acme.example/other",
          events: [EVENT],
          secretName: "ACME_WEBHOOK_SECRET",
        }),
      ),
    ).rejects.toThrow();
    await expect(
      asTenant(undefined, () => new WebhookDeliveryService().record(attempt("evt_no_tenant"))),
    ).rejects.toThrow();
    await expect(new WebhookDeliveryService().record(attempt("evt_no_call"))).rejects.toThrow();
    expect(await stored("webhook_endpoints")).toHaveLength(1);
    expect(await stored("webhook_deliveries")).toHaveLength(1);
  });
});
