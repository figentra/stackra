/**
 * Stackra file contract:
 * Purpose: unit tests of `IntegrationRuntime`: a client credentials token is fetched once for concurrent calls and
 *          reused until it nears expiry; an authorization code connection's expired token is refreshed once and an
 *          unrotated refresh token kept; revocation posts the refresh token and forgets the tokens; a JWT bearer
 *          integration trades a signed assertion (scope, audience, no client credentials) for a cached token; one
 *          integration instance is built per class with this runtime.
 * Boundary: test only; `fetch` is stubbed per URL, the clock is a mutable stand-in and the buckets are the memory driver
 *           of `@stackra/actions`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rules 6, 7, 12 and 20).
 */
import { MemoryRateLimitStoreDriver } from "@stackra/actions";
import { SecretStore } from "@stackra/config/contracts";
import { Clock } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Connection } from "#core/bases/connection.base";
import { Integration } from "#core/bases/integration.base";
import { AuthType } from "#core/enums/auth-type.enum";
import { ConnectionLevel } from "#core/enums/connection-level.enum";
import { IntegrationCategory } from "#core/enums/integration-category.enum";
import { ProviderRefusedError } from "#core/errors/provider-refused.error";
import { encodeBase64 } from "#core/functions/encode-base64.function";
import { hydrateConnection } from "#core/functions/hydrate-connection.function";
import { IntegrationRuntime } from "#core/services/integration-runtime.service";
import type { OAuthTokens } from "#core/types/oauth-tokens.type";
import { ConnectedAccount } from "#core/values/connected-account.value";

/** No secrets: the fixtures carry plain values. */
class EmptySecretStore extends SecretStore {
  get(): string | undefined {
    return undefined;
  }
}

/** A clock the test moves. */
class MovableClock extends Clock {
  at = new Date("2026-10-24T09:00:00Z").getTime();

  now(): Date {
    return new Date(this.at);
  }
}

class ServiceIntegration extends Integration({
  provider: "service",
  category: IntegrationCategory.Other,
  levels: [],
  auth: {
    type: AuthType.OAuth2ClientCredentials,
    tokenUrl: "https://auth.service.example/token",
    clientId: "{clientId}",
    clientSecret: "{clientSecret}",
    scopes: ["read"],
  },
  baseUrl: "https://api.service.example",
}) {
  clientId = "client";

  clientSecret = "secret";
}

class CalendarIntegration extends Integration({
  provider: "calendar",
  category: IntegrationCategory.Calendar,
  levels: [ConnectionLevel.User],
  auth: {
    type: AuthType.OAuth2Code,
    authorizeUrl: "https://auth.calendar.example/authorize",
    tokenUrl: "https://auth.calendar.example/token",
    revokeUrl: "https://auth.calendar.example/revoke",
    clientId: "{clientId}",
    scopes: ["calendar.read"],
  },
  baseUrl: "https://api.calendar.example",
}) {
  clientId = "public-client";
}

/** The service account's PEM key, made before the integration is built. */
let serviceAccountKey = "";

class GoogleIntegration extends Integration({
  provider: "google",
  category: IntegrationCategory.Other,
  levels: [],
  auth: {
    type: AuthType.OAuth2JwtBearer,
    tokenUrl: "https://oauth2.google.example/token",
    key: "{privateKey}",
    keyId: "{privateKeyId}",
    issuer: "{clientEmail}",
    scopes: ["wallet.issuer"],
  },
  baseUrl: "https://api.google.example",
}) {
  privateKey = serviceAccountKey;

  privateKeyId = "kid-1";

  clientEmail = "svc@project.example";
}

class CalendarConnection extends Connection<CalendarIntegration> {
  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: "me" });
  }
}

/** A runtime over a movable clock. */
function setup() {
  const clock = new MovableClock();
  return {
    clock,
    runtime: new IntegrationRuntime(
      new EmptySecretStore(),
      new MemoryRateLimitStoreDriver(),
      clock,
    ),
  };
}

/** Stubs `fetch`: token and revoke endpoints answer `tokens`, the API answers `{}`. */
function stubProvider(tokens: () => Record<string, unknown>) {
  const fetchMock = vi.fn(async (url: string | URL, _init: RequestInit) =>
    String(url).includes("/token") || String(url).includes("/revoke")
      ? Response.json(tokens())
      : Response.json({}),
  );
  vi.stubGlobal("fetch", fetchMock);
  const callsTo = (path: string) =>
    fetchMock.mock.calls.filter(([url]) => String(url).includes(path));
  return { fetchMock, callsTo };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("IntegrationRuntime", () => {
  it("fetches a client credentials token once for concurrent calls and reuses it", async () => {
    const { runtime, clock } = setup();
    let issued = 0;
    const { callsTo, fetchMock } = stubProvider(() => ({
      access_token: `at-${++issued}`,
      expires_in: 3600,
    }));
    const api = runtime.client(runtime.integration(ServiceIntegration));
    await Promise.all([api.get("/a"), api.get("/b"), api.get("/c")]);
    expect(callsTo("/token")).toHaveLength(1);
    expect(new Headers(callsTo("api.service")[2]?.[1].headers).get("authorization")).toBe(
      "Bearer at-1",
    );
    expect(String(callsTo("/token")[0]?.[1].body)).toBe("grant_type=client_credentials&scope=read");

    clock.at += 3600_000 - 30_000; // inside the 60 s refresh buffer
    await api.get("/d");
    expect(callsTo("/token")).toHaveLength(2);
    expect(new Headers(fetchMock.mock.calls.at(-1)?.[1].headers).get("authorization")).toBe(
      "Bearer at-2",
    );
  });

  it("refreshes an expired authorization code token once and keeps an unrotated refresh token", async () => {
    const { runtime, clock } = setup();
    const { callsTo } = stubProvider(() => ({ access_token: "at-new", expires_in: 3600 }));
    const integration = runtime.integration(CalendarIntegration);
    const stored: OAuthTokens = {
      accessToken: "at-old",
      refreshToken: "rt-1",
      expiresAt: new Date(clock.at - 1000),
    };
    const connection = hydrateConnection(
      CalendarConnection,
      { id: "conn_00000000000000000000000001", fields: {}, secrets: {} },
      (built) => runtime.client(integration, built, stored),
    );
    await Promise.all([connection.api.get("/events"), connection.api.get("/calendars")]);
    expect(callsTo("/token")).toHaveLength(1);
    expect(String(callsTo("/token")[0]?.[1].body)).toBe(
      "grant_type=refresh_token&refresh_token=rt-1&client_id=public-client",
    );

    await runtime.revoke(integration, connection);
    expect(String(callsTo("/revoke")[0]?.[1].body)).toBe(
      "token=rt-1&token_type_hint=refresh_token&client_id=public-client",
    );
  });

  it("asks for a new grant when no refresh token is left", async () => {
    const { runtime, clock } = setup();
    stubProvider(() => ({}));
    const integration = runtime.integration(CalendarIntegration);
    const connection = hydrateConnection(
      CalendarConnection,
      { id: "conn_00000000000000000000000002", fields: {}, secrets: {} },
      (built) =>
        runtime.client(integration, built, { accessToken: "at", expiresAt: new Date(clock.at) }),
    );
    const refused = await connection.api.get("/events").catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { code: "invalid_grant" })).toBe(true);
  });

  it("builds one integration instance per class, with itself as its runtime", () => {
    const { runtime } = setup();
    const first = runtime.integration(ServiceIntegration);
    expect(runtime.integration(ServiceIntegration)).toBe(first);
    expect(first).toBeInstanceOf(ServiceIntegration);
    expect(first.api).toBe(first.api);
  });

  it("trades a signed JWT bearer assertion for a token and caches it", async () => {
    const pair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    );
    const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
    serviceAccountKey = `-----BEGIN PRIVATE KEY-----\n${encodeBase64(der)}\n-----END PRIVATE KEY-----\n`;
    const { runtime } = setup();
    const { callsTo } = stubProvider(() => ({ access_token: "ya29", expires_in: 3600 }));
    const api = runtime.client(runtime.integration(GoogleIntegration));
    await Promise.all([api.get("/a"), api.get("/b")]);
    expect(callsTo("/token")).toHaveLength(1);
    const form = new URLSearchParams(String(callsTo("/token")[0]?.[1].body));
    expect(form.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    expect(form.has("client_id")).toBe(false);
    const [header = "", claims = ""] = (form.get("assertion") ?? "").split(".");
    const decode = (part: string) =>
      JSON.parse(atob(part.replaceAll("-", "+").replaceAll("_", "/"))) as Record<string, unknown>;
    expect(decode(header)).toMatchObject({ alg: "RS256", kid: "kid-1" });
    expect(decode(claims)).toMatchObject({
      iss: "svc@project.example",
      aud: "https://oauth2.google.example/token",
      scope: "wallet.issuer",
    });
    expect(new Headers(callsTo("api.google")[1]?.[1].headers).get("authorization")).toBe(
      "Bearer ya29",
    );
  });
});
