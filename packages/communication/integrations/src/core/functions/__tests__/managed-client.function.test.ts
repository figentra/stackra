/**
 * Stackra file contract:
 * Purpose: unit tests of `managedClient`: it joins paths to the base URL and refuses another origin, authenticates by
 *          each auth type (an API key from the connection before the platform's secret, Basic, a signed JWT, an OAuth
 *          bearer), retries only what is safe, honours the idempotency header, keeps to the rate limits, and turns a
 *          4xx into `ProviderRefusedError` and spent retries into `ProviderUnavailableError` without a credential in
 *          either.
 * Boundary: test only; `fetch` is stubbed, the secret store answers from a map, the clock is frozen and the buckets
 *           are the memory driver of `@stackra/actions`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 4, 6, 13 and 20); ADR 0217.
 */
import { MemoryRateLimitStoreDriver } from "@stackra/actions";
import { Secret, SecretStore } from "@stackra/config";
import { Clock } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { RateLimitScope } from "#core/enums/rate-limit-scope.enum";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { ProviderUnavailableError } from "#core/errors/provider-unavailable.error";
import { hydrateConnection } from "#core/functions/hydrate-connection.function";
import { managedClient } from "#core/functions/managed-client.function";
import type { IntegrationOptions } from "#core/types/integration-options.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

/** Answers from a fixed map. */
class MapSecretStore extends SecretStore {
  get(name: string): string | undefined {
    return (
      { MAIL_API_KEY: "platform-key", JWT_KEY: "jwt-shared-secret" } as Record<string, string>
    )[name];
  }
}

/** Always 2026-10-24T09:00:00Z. */
class FrozenClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T09:00:00Z");
  }
}

/** The base of every test description: a mail API with fast retries. */
const BASE = {
  provider: "mail",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  baseUrl: "https://api.mail.example/v1",
  retry: { idempotencyHeader: "Idempotency-Key", attempts: 3, backoff: "1ms" },
} as const;

class MailIntegration extends Integration({
  ...BASE,
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
}) {
  @Secret("MAIL_API_KEY")
  apiKey!: string;
}

class MailConnection extends Connection<MailIntegration> {
  apiKey?: string;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "mail" });
  }
}

/** A client of `type` (a fresh instance) for its own credentials, or for `connection`. */
function clientOf(
  integration: InstanceType<ReturnType<typeof Integration>>,
  extra: {
    connection?: Connection;
    accessToken?: () => Promise<string>;
    limits?: MemoryRateLimitStoreDriver;
  } = {},
) {
  return managedClient({
    integration,
    secrets: new MapSecretStore(),
    limits: extra.limits ?? new MemoryRateLimitStoreDriver(),
    clock: new FrozenClock(),
    ...(extra.connection === undefined ? {} : { connection: extra.connection }),
    ...(extra.accessToken === undefined ? {} : { accessToken: extra.accessToken }),
  });
}

/** Stubs `fetch` with `answer` and returns the mock. */
function stubFetch(answer: (url: URL, init: RequestInit) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (url: URL, init: RequestInit) => answer(url, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The header `name` of call `index`. */
const headerOf = (mock: ReturnType<typeof stubFetch>, index: number, name: string) =>
  new Headers(mock.mock.calls[index]?.[1].headers).get(name);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("managedClient", () => {
  it("joins the path to the base URL, sends JSON and reads JSON", async () => {
    const fetchMock = stubFetch(() => json({ id: "em_1" }));
    const sent = await clientOf(new MailIntegration()).post<{ id: string }>(
      "/emails",
      { to: "a@acme.example" },
      { query: { dryRun: true } },
    );
    expect(sent).toEqual({ id: "em_1" });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://api.mail.example/v1/emails?dryRun=true");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe('{"to":"a@acme.example"}');
    expect(headerOf(fetchMock, 0, "authorization")).toBe("Bearer platform-key");
    expect(headerOf(fetchMock, 0, "content-type")).toBe("application/json");
  });

  it("sends the connection's key before the platform's", async () => {
    const fetchMock = stubFetch(() => new Response(null, { status: 204 }));
    const integration = new MailIntegration();
    const connection = hydrateConnection(
      MailConnection,
      { id: "conn_00000000000000000000000001", fields: { apiKey: "tenant-key" }, secrets: {} },
      (built) => clientOf(integration, { connection: built }),
    );
    await expect(connection.api.delete("/emails/em_1")).resolves.toBeUndefined();
    expect(headerOf(fetchMock, 0, "authorization")).toBe("Bearer tenant-key");
  });

  it("never leaves the base URL's origin, even for an absolute URL", async () => {
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new MailIntegration()).get("https://evil.example/steal");
    await clientOf(new MailIntegration()).get("//evil.example/steal");
    for (const [url] of fetchMock.mock.calls)
      expect(new URL(String(url)).origin).toBe("https://api.mail.example");
  });

  it("turns a 4xx into ProviderRefusedError with the provider's code and no body text", async () => {
    stubFetch(() =>
      json(
        { statusCode: 401, name: "restricted_api_key", message: "key platform-key is restricted" },
        401,
      ),
    );
    const refused = await clientOf(new MailIntegration())
      .get("/domains")
      .catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 401, code: "restricted_api_key" })).toBe(
      true,
    );
    expect(JSON.stringify((refused as ProviderRefusedError).toEnvelope())).not.toContain(
      "platform-key",
    );
  });

  it("retries a GET on a 503, then answers", async () => {
    let calls = 0;
    const fetchMock = stubFetch(() =>
      ++calls < 3 ? new Response("down", { status: 503 }) : json({ ok: true }),
    );
    await expect(clientOf(new MailIntegration()).get("/domains")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws ProviderUnavailableError once the attempts are spent, and on no answer", async () => {
    const fetchMock = stubFetch(() => new Response("down", { status: 502 }));
    const spent = await clientOf(new MailIntegration())
      .get("/domains")
      .catch((error: unknown) => error);
    expect(spent).toBeInstanceOf(ProviderUnavailableError);
    expect((spent as ProviderUnavailableError).details).toEqual({ provider: "mail", status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    stubFetch(() => Promise.reject(new TypeError("fetch failed")));
    await expect(clientOf(new MailIntegration()).get("/domains")).rejects.toBeInstanceOf(
      ProviderUnavailableError,
    );
  });

  it("retries a POST only with an idempotency key, sent in the provider's header", async () => {
    const once = stubFetch(() => new Response("down", { status: 503 }));
    await expect(clientOf(new MailIntegration()).post("/emails", {})).rejects.toBeInstanceOf(
      ProviderUnavailableError,
    );
    expect(once).toHaveBeenCalledTimes(1);

    let calls = 0;
    const keyed = stubFetch(() =>
      ++calls < 2 ? new Response("down", { status: 503 }) : json({ id: "em_2" }),
    );
    await expect(
      clientOf(new MailIntegration()).post("/emails", {}, { idempotencyKey: "msg_1" }),
    ).resolves.toEqual({
      id: "em_2",
    });
    expect(keyed).toHaveBeenCalledTimes(2);
    expect(headerOf(keyed, 1, "idempotency-key")).toBe("msg_1");
  });

  it("keeps to a rate limit, refusing once the bucket stays full past the longest wait", async () => {
    class LimitedIntegration extends Integration({
      ...BASE,
      provider: "limited",
      auth: { type: AuthType.None },
      rateLimits: [{ requests: 1, per: "1h", by: RateLimitScope.Integration }],
    }) {}
    stubFetch(() => json({}));
    const limits = new MemoryRateLimitStoreDriver();
    const api = clientOf(new LimitedIntegration(), { limits });
    await api.get("/ping");
    const refused = await api.get("/ping").catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(ProviderUnavailableError);
    expect((refused as ProviderUnavailableError).retryAfterMs).toBeGreaterThan(30_000);
  });

  it("sends an API key in a query parameter and Basic credentials", async () => {
    class QueryIntegration extends Integration({
      ...BASE,
      provider: "query",
      auth: { type: AuthType.ApiKey, query: "key" },
    }) {
      apiKey = "query-key";
    }
    class BasicIntegration extends Integration({
      ...BASE,
      provider: "basic",
      auth: { type: AuthType.Basic, username: "{accountSid}", password: "{authToken}" },
    }) {
      accountSid = "AC1";

      authToken = "tok";
    }
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new QueryIntegration()).get("/x");
    await clientOf(new BasicIntegration()).get("/x");
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("key")).toBe("query-key");
    expect(headerOf(fetchMock, 1, "authorization")).toBe(`Basic ${btoa("AC1:tok")}`);
  });

  it("signs a JWT for each call", async () => {
    class JwtIntegration extends Integration({
      ...BASE,
      provider: "jwt",
      auth: { type: AuthType.Jwt, algorithm: "HS256", key: "{signingKey}", issuer: "stackra" },
    }) {
      @Secret("JWT_KEY")
      signingKey!: string;
    }
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new JwtIntegration()).get("/x");
    const token = headerOf(fetchMock, 0, "authorization")?.replace("Bearer ", "") ?? "";
    const claims = JSON.parse(
      atob(token.split(".")[1]?.replaceAll("-", "+").replaceAll("_", "/") ?? ""),
    ) as Record<string, unknown>;
    expect(claims).toMatchObject({ iss: "stackra", iat: 1_792_832_400, exp: 1_792_832_700 });
  });

  it("sends an OAuth bearer from its token source, and needs one", async () => {
    class OAuthIntegration extends Integration({
      ...BASE,
      provider: "oauth",
      auth: {
        type: AuthType.OAuth2ClientCredentials,
        tokenUrl: "https://auth.mail.example/token",
        clientId: "{clientId}",
        clientSecret: "{clientSecret}",
      },
    }) {}
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new OAuthIntegration(), { accessToken: async () => "access-1" }).get("/x");
    expect(headerOf(fetchMock, 0, "authorization")).toBe("Bearer access-1");
    await expect(clientOf(new OAuthIntegration()).get("/x")).rejects.toThrow(
      /through a connection/,
    );
  });

  it("explains a call to an integration without a base URL", async () => {
    class HooksOnlyIntegration extends Integration({
      provider: "hooks-only",
      category: IntegrationCategory.Other,
      levels: [],
      auth: { type: AuthType.None },
    } satisfies IntegrationOptions) {}
    await expect(clientOf(new HooksOnlyIntegration()).get("/x")).rejects.toThrow(/no baseUrl/);
  });
});
