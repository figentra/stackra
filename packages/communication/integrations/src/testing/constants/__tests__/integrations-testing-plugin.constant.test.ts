/**
 * Stackra file contract:
 * Purpose: unit tests of `INTEGRATIONS_TESTING_PLUGIN`: `.withIntegrationApi` puts in place an integration whose `api`
 *          is the fake, `.withConnection` puts a connection in the store that `byId` and `find` reach with the fake as
 *          its client, in either order, and a connection whose integration has no fake explains itself when called.
 * Boundary: test only; a fixture module with an empty wiring, the template's ids and test values only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); the STA-348 registry row (builder extension
 *                     point).
 */
import { Secret } from "@stackra/config";
import { Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import type { Email } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import {
  AuthType,
  ConnectedAccount,
  Connection,
  ConnectionLevel,
  ConnectionStore,
  Integration,
  IntegrationCategory,
  registerConnections,
} from "#core/index";
import "#testing/index";
import { fakeIntegrationApi } from "#testing/functions/fake-integration-api.function";

class ResendIntegration extends Integration({
  provider: "resend",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://api.resend.com",
}) {}

class ResendConnection extends Connection<ResendIntegration> {
  @Secret("RESEND_TENANT_API_KEY")
  apiKey!: string;

  fromAddress!: Email;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: this.fromAddress });
  }
}

registerConnections([
  { connection: ResendConnection, integration: ResendIntegration, key: "messages.resend" },
]);

class FixtureModule extends Module {}

const TENANT_CONNECTION = "conn_00000000000000000000000001";

const FIELDS = { apiKey: "re_test_tenant_key", fromAddress: "orders@shop.acme.example" } as const;

/** A fake that answers who called. */
const resend = fakeIntegrationApi(ResendIntegration, (fake) =>
  fake.get("/emails/receiving/:id").returns(({ id }) => ({ id, from: "customer@acme.example" })),
);

beforeEach(() => {
  registerWiring({ member: "fixture", root: FixtureModule });
});

describe("INTEGRATIONS_TESTING_PLUGIN", () => {
  it("puts an integration whose api is the fake in place", async () => {
    const app = await createTestingModule(FixtureModule)
      .withIntegrationApi(ResendIntegration, resend)
      .compile();
    await expect(app.get(ResendIntegration).api.get("/emails/receiving/em_1")).resolves.toEqual({
      id: "em_1",
      from: "customer@acme.example",
    });
  });

  it("puts a connection in the store, reached by id and by find, with the fake as its client", async () => {
    const app = await createTestingModule(FixtureModule)
      .withConnection(ResendConnection, { id: TENANT_CONNECTION, fields: FIELDS })
      .withIntegrationApi(ResendIntegration, resend)
      .compile();
    const store = app.get(ConnectionStore);
    const byId = await store.byId(ResendConnection, TENANT_CONNECTION);
    expect(byId.fromAddress).toBe("orders@shop.acme.example");
    expect(byId.apiKey).toBe("re_test_tenant_key");
    expect((await store.find(ResendConnection))?.id).toBe(TENANT_CONNECTION);
    await expect(byId.api.get("/emails/receiving/em_2")).resolves.toMatchObject({ id: "em_2" });
  });

  it("explains a connection whose integration has no fake", async () => {
    const app = await createTestingModule(FixtureModule)
      .withConnection(ResendConnection, { id: TENANT_CONNECTION, fields: FIELDS })
      .compile();
    const connection = await app.get(ConnectionStore).byId(ResendConnection, TENANT_CONNECTION);
    expect(() => connection.api.get("/domains")).toThrow(/withIntegrationApi/);
  });
});
