/**
 * Stackra file contract:
 * Purpose: unit tests of `managedClient`: it joins paths to the base URL and refuses another origin (a resolved base URL is https, or http only on an `.internal` host), authenticates by
 *          each auth type (an API key from the connection before the platform's secret, Basic, a signed JWT, an OAuth
 *          bearer, or a token in the header and layout the Integration names), adds the declared headers under the
 *          call's own, sends a form body when the call or the Integration asks, reads raw bytes when the call asks, retries only what is safe, honours the idempotency header, keeps to the rate limits, and turns a
 *          4xx into `ProviderRefusedError` and spent retries into `ProviderUnavailableError`, while `send` answers
 *          every status as it came and throws only when nothing came back, all without a credential in
 *          either: a provider code that echoes a connection's or the platform's secret, or the bearer sent, is
 *          redacted under every key a provider names it, and the client logs nothing.
 * Boundary: test only; `fetch` is stubbed, the secret store answers from a map, the clock is frozen and the buckets
 *           are the memory driver of `@stackra/actions`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 4, 6, 13 and 20); ADR 0217; STA-793; stackra-223
 *                     (`retry.base` was `retry.backoff: "1ms"`; the default 200 ms doubling to 30 s is pinned in the
 *                     contracts `backoffDelay` test).
 */
import { inspect } from "node:util";

import { MemoryRateLimitStoreDriver } from "@stackra/actions";
import { Secret } from "@stackra/config";
import { SecretStore } from "@stackra/config/contracts";
import { Clock, Duration, HttpMethod } from "@stackra/contracts";
import { afterEach, beforeEach, describe, expect, it } from "@stackra/testing";
import { type MockInstance, vi } from "vitest";

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
  retry: { idempotencyHeader: "Idempotency-Key", attempts: 3, base: Duration.parse("1ms") },
} as const;

class MailIntegration extends Integration({
  ...BASE,
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
}) {
  @Secret("MAIL_API_KEY")
  apiKey!: string;
}

class FormIntegration extends Integration({
  ...BASE,
  provider: "forms",
  requestBody: "form",
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

  it("reads the answer as raw bytes when the call asks, and asks for any media type", async () => {
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0xff, 0x00, 0x80]);
    const fetchMock = stubFetch(
      () => new Response(pdf, { status: 200, headers: { "content-type": "application/pdf" } }),
    );

    const bytes = await clientOf(new MailIntegration()).get<Uint8Array>("/labels/1", {
      bytes: true,
    });

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect([...bytes]).toEqual([...pdf]);
    expect(headerOf(fetchMock, 0, "accept")).toBe("*/*");
  });

  it("sends a raw body as given with its media type, and reads the answer as text", async () => {
    const envelope = '<soap:Envelope><soap:Body><Track id="1&amp;2"/></soap:Body></soap:Envelope>';
    const reply =
      "<soap:Envelope><soap:Body><TrackResult>ok</TrackResult></soap:Body></soap:Envelope>";
    const fetchMock = stubFetch(
      () => new Response(reply, { status: 200, headers: { "content-type": "text/xml" } }),
    );

    const text = await clientOf(new MailIntegration()).post<string>("/Service.asmx", undefined, {
      body: { content: envelope, contentType: "text/xml; charset=utf-8" },
      text: true,
    });

    expect(text).toBe(reply);
    expect(fetchMock.mock.calls[0]?.[1].body).toBe(envelope);
    expect(headerOf(fetchMock, 0, "content-type")).toBe("text/xml; charset=utf-8");
    expect(headerOf(fetchMock, 0, "accept")).toBe("*/*");
    expect(headerOf(fetchMock, 0, "authorization")).toBe("Bearer platform-key");
  });

  it("refuses a call that gives both a body and a raw body", async () => {
    stubFetch(() => json({}));

    await expect(
      clientOf(new MailIntegration()).post(
        "/messages",
        { a: 1 },
        { body: { content: "<a/>", contentType: "text/xml" } },
      ),
    ).rejects.toThrow(TypeError);
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
      rateLimits: [{ requests: 1, per: Duration.hours(1), by: RateLimitScope.Integration }],
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
    class KeyOnlyIntegration extends Integration({
      ...BASE,
      provider: "key_only",
      auth: { type: AuthType.Basic, username: "{apiKey}", password: "" },
    }) {
      apiKey = "sk_1";
    }
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new QueryIntegration()).get("/x");
    await clientOf(new BasicIntegration()).get("/x");
    await clientOf(new KeyOnlyIntegration()).get("/x");
    expect(new URL(String(fetchMock.mock.calls[0]?.[0])).searchParams.get("key")).toBe("query-key");
    expect(headerOf(fetchMock, 1, "authorization")).toBe(`Basic ${btoa("AC1:tok")}`);
    // An empty password still sends the colon (RFC 7617), as Medusa's and Stripe's API keys expect.
    expect(headerOf(fetchMock, 2, "authorization")).toBe(`Basic ${btoa("sk_1:")}`);
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

  it("sends an OAuth token in the header and layout the Integration names", async () => {
    class MarketplaceIntegration extends Integration({
      ...BASE,
      provider: "market",
      auth: {
        type: AuthType.OAuth2ClientCredentials,
        tokenUrl: "https://auth.mail.example/token",
        clientId: "{clientId}",
        clientSecret: "{clientSecret}",
        token: { header: "x-access-token", format: "{accessToken}" },
      },
    }) {}
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new MarketplaceIntegration(), { accessToken: async () => "access-2" }).get("/x");
    expect(headerOf(fetchMock, 0, "x-access-token")).toBe("access-2");
    expect(headerOf(fetchMock, 0, "authorization")).toBeNull();
  });

  it("adds the declared headers with their placeholders, under the call's own and the credentials", async () => {
    class HeadedIntegration extends Integration({
      ...BASE,
      provider: "headed",
      auth: { type: AuthType.ApiKey, header: "authorization", format: "Bearer {apiKey}" },
      headers: { "x-developer-token": "{apiKey}", "x-account": "main", authorization: "nope" },
    }) {
      @Secret("MAIL_API_KEY")
      apiKey!: string;
    }
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new HeadedIntegration()).get("/x", { headers: { "x-account": "child" } });
    expect(headerOf(fetchMock, 0, "x-developer-token")).toBe("platform-key");
    expect(headerOf(fetchMock, 0, "x-account")).toBe("child");
    expect(headerOf(fetchMock, 0, "authorization")).toBe("Bearer platform-key");
  });

  it("sends a form body when the call asks, repeating array fields", async () => {
    const fetchMock = stubFetch(() => json({ sid: "SM1" }));
    await clientOf(new MailIntegration()).post(
      "/messages",
      { To: "+966500000001", Body: "Hi there", MediaUrl: ["a", "b"], Skip: undefined },
      { form: true },
    );
    expect(fetchMock.mock.calls[0]?.[1].body).toBe(
      "To=%2B966500000001&Body=Hi+there&MediaUrl=a&MediaUrl=b",
    );
    expect(headerOf(fetchMock, 0, "content-type")).toBe("application/x-www-form-urlencoded");
    await expect(
      clientOf(new MailIntegration()).post("/messages", { nested: { a: 1 } }, { form: true }),
    ).rejects.toThrow(/string, a number or a boolean/);
  });

  it("sends a form body when the Integration asks, unless the call says JSON", async () => {
    const fetchMock = stubFetch(() => json({}));
    const api = clientOf(new FormIntegration());
    await api.post("/charges", { amount: 100, "metadata[reference]": "ord_1" });
    expect(fetchMock.mock.calls[0]?.[1].body).toBe("amount=100&metadata%5Breference%5D=ord_1");
    expect(headerOf(fetchMock, 0, "content-type")).toBe("application/x-www-form-urlencoded");
    await api.post("/json", { a: 1 }, { form: false });
    expect(fetchMock.mock.calls[1]?.[1].body).toBe('{"a":1}');
  });

  it("fills a per-region host from the credential set", async () => {
    class RegionalIntegration extends Integration({
      ...BASE,
      provider: "regional",
      baseUrl: "https://{host}/api",
      auth: { type: AuthType.None },
    }) {
      host = "gcc.inbox.example";
    }
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new RegionalIntegration()).get("/ping");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://gcc.inbox.example/api/ping");
  });

  it("takes a whole-URL placeholder, with http only on an .internal host", async () => {
    class ToolsIntegration extends Integration({
      ...BASE,
      provider: "tools",
      baseUrl: "{endpoint}",
      auth: { type: AuthType.None },
    }) {
      endpoint = "http://x.internal:8080";
    }
    const fetchMock = stubFetch(() => json({}));
    await clientOf(new ToolsIntegration()).get("/ping");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("http://x.internal:8080/ping");
    for (const endpoint of ["http://example.com", "http://x.internal.evil.com", "not a url"]) {
      const bad = new ToolsIntegration();
      bad.endpoint = endpoint;
      await expect(clientOf(bad).get("/ping")).rejects.toThrow(/must resolve to an https origin/);
    }
    const secure = new ToolsIntegration();
    secure.endpoint = "https://tools.example";
    await clientOf(secure).get("/ping");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://tools.example/ping");
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

/** A connection that keeps its key as a `@Secret` field. */
class SecretMailConnection extends Connection<MailIntegration> {
  @Secret("MAIL_CONNECTION_API_KEY")
  apiKey!: string;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "mail" });
  }
}

const ECHOED_KEY = "sk_test_5b8e1f9c";

describe("managedClient send", () => {
  it("answers a 4xx as it came, with its headers and text, authenticated and on its origin", async () => {
    const result = '{"validationResults":{"status":"ERROR"}}';
    const fetchMock = stubFetch(
      () =>
        new Response(result, {
          status: 400,
          headers: { "content-type": "application/json", "X-Request-Id": "req_1" },
        }),
    );

    const answer = await clientOf(new MailIntegration()).send({
      method: HttpMethod.Post,
      path: "https://elsewhere.example/invoices",
      headers: { "Accept-Version": "V2" },
      body: { content: '{"invoice":"PD94"}', contentType: "application/json" },
    });

    expect(answer).toEqual({
      status: 400,
      headers: { "content-type": "application/json", "x-request-id": "req_1" },
      body: result,
    });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url).startsWith("https://api.mail.example/v1/")).toBe(true);
    expect(init?.body).toBe('{"invoice":"PD94"}');
    expect(headerOf(fetchMock, 0, "authorization")).toBe("Bearer platform-key");
    expect(headerOf(fetchMock, 0, "accept-version")).toBe("V2");
    expect(headerOf(fetchMock, 0, "accept")).toBe("*/*");
  });

  it("retries a transient status as the typed calls do, then returns the last answer", async () => {
    const fetchMock = stubFetch(() => new Response("down", { status: 503 }));
    const api = clientOf(new MailIntegration());

    await expect(api.send({ method: HttpMethod.Get, path: "/status" })).resolves.toMatchObject({
      status: 503,
      body: "down",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await api.send({ method: HttpMethod.Post, path: "/invoices" });
    expect(fetchMock).toHaveBeenCalledTimes(4);

    await api.send({ method: HttpMethod.Post, path: "/invoices", idempotencyKey: "inv_1" });
    expect(fetchMock).toHaveBeenCalledTimes(7);
    expect(headerOf(fetchMock, 6, "idempotency-key")).toBe("inv_1");
  });

  it("reads an empty answer as an empty body", async () => {
    stubFetch(() => new Response(null, { status: 204 }));

    await expect(
      clientOf(new MailIntegration()).send({ method: HttpMethod.Delete, path: "/invoices/1" }),
    ).resolves.toEqual({ status: 204, headers: {}, body: "" });
  });

  it("throws ProviderUnavailableError only when nothing came back", async () => {
    stubFetch(() => Promise.reject(new TypeError("fetch failed")));

    await expect(
      clientOf(new MailIntegration()).send({ method: HttpMethod.Get, path: "/status" }),
    ).rejects.toBeInstanceOf(ProviderUnavailableError);
  });
});

/** Everything a refusal shows: its printout, its JSON, its envelope and every console line written. */
function shownOf(refused: unknown, consoleSpies: readonly MockInstance[]): string {
  return [
    inspect(refused, { depth: 10, showHidden: true }),
    JSON.stringify(refused),
    JSON.stringify((refused as ProviderRefusedError).toEnvelope()),
    ...consoleSpies.flatMap((spy) => spy.mock.calls.map((args) => inspect(args))),
  ].join("\n");
}

describe("managedClient with a provider that echoes a credential", () => {
  let consoleSpies: MockInstance[] = [];

  beforeEach(() => {
    consoleSpies = (["log", "info", "warn", "error", "debug"] as const).map((method) =>
      vi.spyOn(console, method).mockImplementation(() => undefined),
    );
  });

  afterEach(() => {
    for (const spy of consoleSpies) spy.mockRestore();
  });

  const echoes = [ECHOED_KEY, `bad_key_${ECHOED_KEY}_given`, `The key ${ECHOED_KEY} is not valid`];
  const cases = ["code", "error", "name", "type", "message"].flatMap((field) =>
    echoes.flatMap((echo) => [
      { field, echo, body: { [field]: echo } },
      { field, echo, body: { error: { [field]: echo } } },
    ]),
  );

  it.each(cases)("redacts the key echoed under $field ($echo)", async ({ body }) => {
    stubFetch(() => json(body, 401));
    const connection = hydrateConnection(
      SecretMailConnection,
      { id: "conn_00000000000000000000000001", fields: {}, secrets: { apiKey: ECHOED_KEY } },
      (built) => clientOf(new MailIntegration(), { connection: built }),
    );
    const refused = await connection.api.get("/domains").catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 401 })).toBe(true);
    expect((refused as ProviderRefusedError).providerCode ?? "[redacted]").toBe("[redacted]");
    const shown = shownOf(refused, consoleSpies);
    expect(shown).not.toContain(ECHOED_KEY);
    expect(shown).not.toContain("5b8e1f9c");
  });

  it("redacts the platform's secret and the OAuth bearer it sent", async () => {
    stubFetch(() => json({ error: { code: "platform-key" } }, 403));
    const platform = await clientOf(new MailIntegration())
      .get("/domains")
      .catch((error: unknown) => error);
    expect(ProviderRefusedError.is(platform, { status: 403, code: "[redacted]" })).toBe(true);

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
    stubFetch(() => json({ name: "token_at_7d41e2_expired" }, 401));
    const bearer = await clientOf(new OAuthIntegration(), { accessToken: async () => "at_7d41e2" })
      .get("/x")
      .catch((error: unknown) => error);
    expect(ProviderRefusedError.is(bearer, { status: 401, code: "[redacted]" })).toBe(true);
    expect(shownOf(bearer, consoleSpies)).not.toContain("at_7d41e2");
  });

  it("keeps a code that holds no credential", async () => {
    stubFetch(() => json({ error: { type: "invalid_request" } }, 400));
    const refused = await clientOf(new MailIntegration())
      .get("/domains")
      .catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 400, code: "invalid_request" })).toBe(true);
  });
});
