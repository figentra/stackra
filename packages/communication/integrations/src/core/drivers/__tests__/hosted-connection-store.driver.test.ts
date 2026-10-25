/**
 * Stackra file contract:
 * Purpose: unit tests of `HostedConnectionStoreDriver`: connect runs `check()` here and hands the record and the code
 *          exchange's tokens to the host; a loaded OAuth connection asks the host for each access token; a reconnect
 *          disconnects the owner's old connection at the host; byId refuses what the host does not have; disconnect
 *          unsubscribes before the host revokes.
 * Boundary: test only; the host is an in-memory stand-in recording its calls, `fetch` is stubbed and the context is
 *           fixed.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 7, 10, 12, 14, 18 and 20).
 */
import { MemoryRateLimitStoreDriver } from "@stackra/actions";
import { Secret, SecretStore } from "@stackra/config";
import { Clock, type PublicId, type ScopeRef } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { HostedConnectionStoreDriver } from "#core/drivers/hosted-connection-store.driver";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { registerConnections } from "#core/functions/register-connections.function";
import { ConnectionContext } from "#core/ports/connection-context.port";
import { ConnectionHost } from "#core/ports/connection-host.port";
import { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { ConnectionRecord } from "#core/types/connection-record.type";
import type { ConnectionWebhooks } from "#core/types/connection-webhooks.type";
import type { OAuthTokens } from "#core/types/oauth-tokens.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

const SHOP: ScopeRef = { id: "scp_00000000000000000000000002", path: "root.shop" };

class EmptySecretStore extends SecretStore {
  get(): string | undefined {
    return undefined;
  }
}

class SystemTestClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** The integrations service, in memory. */
class MemoryConnectionHost extends ConnectionHost {
  readonly records = new Map<string, ConnectionRecord>();

  readonly tokens = new Map<string, OAuthTokens | undefined>();

  readonly disconnected: string[] = [];

  async list(
    _key: string,
    owners: { readonly scope?: ScopeRef; readonly userId?: PublicId<"usr"> },
  ) {
    return [...this.records.values()].filter(
      (record) =>
        record.scope?.id === owners.scope?.id ||
        (record.userId !== undefined && record.userId === owners.userId),
    );
  }

  async get(_key: string, id: string) {
    return this.records.get(id) ?? null;
  }

  async store(_key: string, record: ConnectionRecord, tokens: OAuthTokens | undefined) {
    this.records.set(record.id, record);
    this.tokens.set(record.id, tokens);
  }

  async disconnect(_key: string, id: string) {
    this.disconnected.push(id);
    this.records.delete(id);
  }

  async accessToken(_key: string, id: string) {
    return `host-token-for-${id}`;
  }
}

class CrmIntegration extends Integration({
  provider: "crm",
  category: IntegrationCategory.Crm,
  levels: [ConnectionLevel.Scope],
  auth: {
    type: AuthType.OAuth2Code,
    authorizeUrl: "https://crm.example/oauth/authorize",
    tokenUrl: "https://crm.example/oauth/token",
    clientId: "{clientId}",
    scopes: ["contacts.read"],
  },
  baseUrl: "https://api.crm.example",
}) {
  clientId = "crm-client";
}

class CrmConnection extends Connection<CrmIntegration> implements ConnectionWebhooks {
  @Secret("CRM_WEBHOOK_SECRET")
  webhookSecret?: string;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: (await this.api.get<{ portal: string }>("/me")).portal });
  }

  async unsubscribe(): Promise<void> {
    await this.api.delete("/webhooks/current");
  }
}

registerConnections([{ connection: CrmConnection, integration: CrmIntegration, key: "sales.crm" }]);

const context = Object.assign(Object.create(ConnectionContext.prototype) as ConnectionContext, {
  scope: () => SHOP,
  user: () => undefined,
});

const fetchMock = vi.fn(async (url: string | URL, _init: RequestInit) =>
  Response.json({ portal: "p-1", url: String(url) }),
);

/** The bearer of fetch call `index`. */
const bearerOf = (index: number) =>
  new Headers(fetchMock.mock.calls.at(index)?.[1].headers).get("authorization");

/** A store over a fresh host. */
function setup() {
  const host = new MemoryConnectionHost();
  const runtime = new IntegrationRuntime(
    new EmptySecretStore(),
    new MemoryRateLimitStoreDriver(),
    new SystemTestClock(),
  );
  return { host, store: new HostedConnectionStoreDriver(context, runtime, host) };
}

const TOKENS: OAuthTokens = { accessToken: "exchange-access", refreshToken: "exchange-refresh" };

beforeEach(() => {
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HostedConnectionStoreDriver", () => {
  it("checks on the exchange's access token and hands the tokens to the host", async () => {
    const { host, store } = setup();
    const added = await store.connect(CrmConnection, { fields: {}, tokens: TOKENS });
    expect(bearerOf(0)).toBe("Bearer exchange-access");
    expect(host.records.get(added.id)).toMatchObject({
      level: "scope",
      scope: SHOP,
      account: { id: "p-1" },
    });
    expect(host.tokens.get(added.id)).toEqual(TOKENS);
  });

  it("asks the host for each access token of a loaded connection", async () => {
    const { store } = setup();
    const added = await store.connect(CrmConnection, { fields: {}, tokens: TOKENS });
    const found = await store.find(CrmConnection);
    await found?.api.get("/contacts");
    expect(bearerOf(-1)).toBe(`Bearer host-token-for-${added.id}`);
  });

  it("disconnects the owner's old connection at the host on a reconnect", async () => {
    const { host, store } = setup();
    const first = await store.connect(CrmConnection, { fields: {}, tokens: TOKENS });
    const second = await store.connect(CrmConnection, { fields: {}, tokens: TOKENS });
    expect(host.disconnected).toEqual([first.id]);
    expect((await store.list(CrmConnection)).map((connection) => connection.id)).toEqual([
      second.id,
    ]);
  });

  it("unsubscribes before the host revokes, and refuses what the host does not have", async () => {
    const { host, store } = setup();
    const added = await store.connect(CrmConnection, { fields: {}, tokens: TOKENS });
    await store.disconnect(CrmConnection, added.id);
    expect(String(fetchMock.mock.calls.at(-1)?.[0])).toBe(
      "https://api.crm.example/webhooks/current",
    );
    expect(host.disconnected).toEqual([added.id]);
    await expect(store.byId(CrmConnection, added.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
