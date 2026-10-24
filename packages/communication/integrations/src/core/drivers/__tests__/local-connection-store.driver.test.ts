/**
 * Stackra file contract:
 * Purpose: unit tests of `LocalConnectionStoreDriver`: connect checks before it stores and owns the connection by the
 *          call's scope node; find walks the levels and the scope path; a reconnect replaces the old connection
 *          (unsubscribing it) unless `multiple`, where find is ambiguous and list returns both; subscribe's secret is
 *          kept in the webhook secret field; byId and disconnect refuse an unknown id.
 * Boundary: test only; a real `IntegrationRuntime` over a stubbed `fetch`, a map secret store and a mutable context.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 2, 9, 10, 12, 14, 17 and 18).
 */
import { MemoryRateLimitStoreDriver } from "@stackra/actions";
import { Secret, SecretStore } from "@stackra/config";
import { Clock, type PublicId, type ScopeRef } from "@stackra/contracts";
import { NotFoundError } from "@stackra/errors";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { LocalConnectionStoreDriver } from "#core/drivers/local-connection-store.driver";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { ConnectionAmbiguousError } from "#core/errors/connection-ambiguous.error";
import { ConnectionCheckFailedError } from "#core/errors/connection-check-failed.error";
import { registerConnections } from "#core/functions/register-connections.function";
import { ConnectionContext } from "#core/ports/connection-context.port";
import { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { ConnectionSubscription } from "#core/types/connection-subscription.type";
import type { ConnectionWebhooks } from "#core/types/connection-webhooks.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

const ROOT: ScopeRef = { id: "scp_00000000000000000000000001", path: "root" };
const SHOP: ScopeRef = { id: "scp_00000000000000000000000002", path: "root.shop" };
const USER: PublicId<"usr"> = "usr_00000000000000000000000001";

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

const OPTIONS = {
  category: IntegrationCategory.Email,
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://api.mail.example",
  webhooks: { scheme: "standard_webhooks", secret: "{webhookSecret}", eventType: { path: "type" } },
} as const;

class MailIntegration extends Integration({
  ...OPTIONS,
  provider: "mail",
  levels: [ConnectionLevel.User, ConnectionLevel.Scope],
}) {}

class MailConnection extends Connection<MailIntegration> implements ConnectionWebhooks {
  @Secret("MAIL_TENANT_API_KEY")
  apiKey!: string;

  @Secret("MAIL_TENANT_WEBHOOK_SECRET")
  webhookSecret?: string;

  label!: string;

  async check(): Promise<ConnectedAccount> {
    const me = await this.api.get<{ id: string; verified: boolean }>("/me");
    if (!me.verified) throw ConnectionCheckFailedError.create({ reason: "account_unverified" });
    return ConnectedAccount.create({ id: me.id, label: this.label });
  }

  async subscribe(webhookUrl: string): Promise<ConnectionSubscription> {
    await this.api.post("/webhooks", { url: webhookUrl });
    return { secret: "whsec_issued" };
  }

  async unsubscribe(): Promise<void> {
    await this.api.delete("/webhooks/current");
  }
}

class TeamIntegration extends Integration({
  ...OPTIONS,
  provider: "team",
  levels: [ConnectionLevel.Scope],
  multiple: true,
}) {}

class TeamConnection extends Connection<TeamIntegration> {
  @Secret("TEAM_API_KEY")
  apiKey!: string;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: (await this.api.get<{ id: string }>("/me")).id });
  }
}

registerConnections([
  { connection: MailConnection, integration: MailIntegration, key: "messages.mail" },
  { connection: TeamConnection, integration: TeamIntegration, key: "messages.team" },
]);

/** The call's owners, moved by each test. */
const call: { scope: ScopeRef | undefined; user: PublicId<"usr"> | undefined } = {
  scope: SHOP,
  user: undefined,
};

const context = Object.assign(Object.create(ConnectionContext.prototype) as ConnectionContext, {
  scope: () => call.scope,
  user: () => call.user,
});

let verified = true;

/** The provider: every call answers the key it was sent with, and whether the account is verified. */
const fetchMock = vi.fn(async (url: string | URL, init: RequestInit) =>
  Response.json({ id: new Headers(init.headers).get("authorization"), verified, url: String(url) }),
);

/** A store over a fresh runtime. */
const newStore = () =>
  new LocalConnectionStoreDriver(
    context,
    new IntegrationRuntime(
      new EmptySecretStore(),
      new MemoryRateLimitStoreDriver(),
      new SystemTestClock(),
    ),
  );

beforeEach(() => {
  call.scope = SHOP;
  call.user = undefined;
  verified = true;
  fetchMock.mockClear();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("LocalConnectionStoreDriver", () => {
  it("checks, stores at the call's scope node and finds the connection with its own key", async () => {
    const store = newStore();
    const added = await store.connect(MailConnection, {
      level: ConnectionLevel.Scope,
      fields: { apiKey: "key-1", label: "Shop mail" },
    });
    expect(added.id).toMatch(/^conn_[0-9A-Z]{26}$/);
    const found = await store.find(MailConnection);
    expect(found?.id).toBe(added.id);
    expect(found?.label).toBe("Shop mail");
    expect(Object.keys(found ?? {})).not.toContain("apiKey");
    await found?.api.get("/me");
    expect(new Headers(fetchMock.mock.calls.at(-1)?.[1].headers).get("authorization")).toBe(
      "Bearer key-1",
    );
  });

  it("stores nothing when check() refuses", async () => {
    const store = newStore();
    verified = false;
    await expect(
      store.connect(MailConnection, {
        level: ConnectionLevel.Scope,
        fields: { apiKey: "key-1", label: "x" },
      }),
    ).rejects.toBeInstanceOf(ConnectionCheckFailedError);
    await expect(store.find(MailConnection)).resolves.toBeNull();
  });

  it("walks the user first, then the scope path upwards", async () => {
    const store = newStore();
    call.scope = ROOT;
    const atRoot = await store.connect(MailConnection, {
      level: ConnectionLevel.Scope,
      fields: { apiKey: "root", label: "root" },
    });
    call.scope = SHOP;
    expect((await store.find(MailConnection))?.id).toBe(atRoot.id);

    call.user = USER;
    const own = await store.connect(MailConnection, {
      level: ConnectionLevel.User,
      fields: { apiKey: "mine", label: "mine" },
    });
    expect((await store.find(MailConnection))?.id).toBe(own.id);
    expect((await store.list(MailConnection)).map((connection) => connection.id)).toEqual([
      own.id,
      atRoot.id,
    ]);

    call.scope = undefined;
    call.user = undefined;
    await expect(store.find(MailConnection)).resolves.toBeNull();
  });

  it("replaces the owner's connection and unsubscribes the old one", async () => {
    const store = newStore();
    const first = await store.connect(MailConnection, {
      level: ConnectionLevel.Scope,
      fields: { apiKey: "a", label: "a" },
    });
    const unsubscribed = vi.spyOn(MailConnection.prototype, "unsubscribe");
    const second = await store.connect(MailConnection, {
      level: ConnectionLevel.Scope,
      fields: { apiKey: "b", label: "b" },
    });
    expect(unsubscribed).toHaveBeenCalledTimes(1);
    expect((await store.find(MailConnection))?.id).toBe(second.id);
    await expect(store.byId(MailConnection, first.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("keeps several connections when multiple, so find is ambiguous and list returns them", async () => {
    const store = newStore();
    await store.connect(TeamConnection, { fields: { apiKey: "one" } });
    await store.connect(TeamConnection, { fields: { apiKey: "two" } });
    await expect(store.find(TeamConnection)).rejects.toBeInstanceOf(ConnectionAmbiguousError);
    expect(await store.list(TeamConnection)).toHaveLength(2);
  });

  it("keeps the secret subscribe() returns in the webhook secret field", async () => {
    const store = newStore();
    const added = await store.connect(MailConnection, {
      level: ConnectionLevel.Scope,
      fields: { apiKey: "key-1", label: "x" },
      webhookUrl: "https://hooks.acme.example/webhooks/messages/mail/conn",
    });
    expect(added.webhookSecret).toBe("whsec_issued");
    expect((await store.byId(MailConnection, added.id)).webhookSecret).toBe("whsec_issued");
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith("/webhooks"))).toBe(true);
  });

  it("disconnects by id and refuses an unknown one", async () => {
    const store = newStore();
    const added = await store.connect(MailConnection, {
      level: ConnectionLevel.Scope,
      fields: { apiKey: "k", label: "k" },
    });
    await store.disconnect(MailConnection, added.id);
    await expect(store.byId(MailConnection, added.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(store.disconnect(MailConnection, added.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(store.byId(TeamConnection, added.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses a level the integration does not hold, and an owner the call lacks", async () => {
    const store = newStore();
    await expect(
      store.connect(TeamConnection, { level: ConnectionLevel.User, fields: { apiKey: "k" } }),
    ).rejects.toThrow(/does not hold user connections/);
    await expect(
      store.connect(MailConnection, {
        level: ConnectionLevel.User,
        fields: { apiKey: "k", label: "k" },
      }),
    ).rejects.toThrow(/acts for a user/);
  });
});
