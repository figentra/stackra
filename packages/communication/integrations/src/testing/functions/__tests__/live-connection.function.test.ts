/**
 * Stackra file contract:
 * Purpose: unit tests of `liveConnection`: the connection's calls carry the Integration's auth and declared headers
 *          (the connection's key and a platform secret given by name), reach the base URL its per-region field
 *          resolves, wait for a full rate-limit bucket, and refuse with an error and a connection that never hold a
 *          secret value.
 * Boundary: test only; `fetch` is stubbed with an in-process fake endpoint, so no request leaves the process. Timers
 *           and `Date` are faked for the rate-limit wait, which the system clock reads.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (decision 3); ADR 0308 (rules 4, 6, 13 and 20).
 */
import { inspect } from "node:util";

import { Secret } from "@stackra/config";
import { Duration } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import {
  AuthType,
  ConnectedAccount,
  Connection,
  ConnectionLevel,
  Integration,
  IntegrationCategory,
  ProviderRefusedError,
  RateLimitScope,
} from "#core/index";
import { liveConnection } from "#testing/functions/live-connection.function";

const CONNECTION_KEY = "sandbox-connection-key-4f1c9a";
const PARTNER_KEY = "sandbox-partner-key-77d2e0";

class SandboxIntegration extends Integration({
  provider: "sandbox",
  category: IntegrationCategory.Email,
  levels: [ConnectionLevel.Scope],
  auth: { type: AuthType.ApiKey, header: "Authorization", format: "Bearer {apiKey}" },
  baseUrl: "https://{region}.api.sandbox.example/v2",
  headers: { "x-partner-key": "{partnerKey}" },
  rateLimits: [{ requests: 1, per: Duration.parse("100ms"), by: RateLimitScope.Credential }],
}) {
  @Secret("SANDBOX_PARTNER_KEY")
  partnerKey!: string;
}

class SandboxConnection extends Connection<SandboxIntegration> {
  @Secret("SANDBOX_API_KEY")
  apiKey!: string;

  region!: string;

  async check(): Promise<ConnectedAccount> {
    return ConnectedAccount.create({ id: (await this.api.get<{ id: string }>("/accounts/me")).id });
  }
}

/** The fake endpoint: answers each call with `answer` and records it. */
function stubEndpoint(answer: (url: URL, headers: Headers) => Response) {
  const fetchMock = vi.fn(async (url: URL, init: RequestInit) =>
    answer(url, new Headers(init.headers)),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const connect = () =>
  liveConnection(SandboxConnection, {
    integration: SandboxIntegration,
    fields: { apiKey: CONNECTION_KEY, region: "eu" },
    secrets: { SANDBOX_PARTNER_KEY: PARTNER_KEY },
  });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("liveConnection", () => {
  it("sends the auth and declared headers to the resolved base URL", async () => {
    const fetchMock = stubEndpoint(() => Response.json({ id: "acct_1" }));
    await expect(connect().check()).resolves.toMatchObject({ id: "acct_1" });
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe("https://eu.api.sandbox.example/v2/accounts/me");
    const headers = new Headers(init?.headers);
    expect(headers.get("authorization")).toBe(`Bearer ${CONNECTION_KEY}`);
    expect(headers.get("x-partner-key")).toBe(PARTNER_KEY);
  });

  it("waits for a full rate-limit bucket before the next call", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "Date"] });
    const fetchMock = stubEndpoint(() => Response.json({ id: "acct_1" }));
    const connection = connect();
    await connection.api.get("/ping");
    const second = connection.api.get("/ping");
    await vi.advanceTimersByTimeAsync(50);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(50);
    await second;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("never puts a secret value in a refusal or the connection's printout", async () => {
    stubEndpoint(
      (_url, headers) =>
        new Response(
          JSON.stringify({
            error: {
              type: "invalid_api_key",
              message: `Key ${headers.get("authorization")} unknown`,
            },
          }),
          { status: 401 },
        ),
    );
    const connection = connect();
    const refused = await connection.check().catch((error: unknown) => error);
    expect(ProviderRefusedError.is(refused, { status: 401, code: "invalid_api_key" })).toBe(true);
    const printed = [
      inspect(refused, { depth: 10, showHidden: true }),
      JSON.stringify(refused),
      inspect(connection, { depth: 10 }),
      JSON.stringify(connection),
    ].join("\n");
    expect(printed).not.toContain(CONNECTION_KEY);
    expect(printed).not.toContain(PARTNER_KEY);
  });
});
