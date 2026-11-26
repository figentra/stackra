/**
 * Stackra file contract:
 * Purpose: unit tests of `ZitadelServiceTokensDriver` against a fake token endpoint: it is the `ServiceTokens` port; it
 *          signs an RS256 JWT-profile assertion with the key file from the secret store (`kid` the key id, `iss` and
 *          `sub` the service user, `aud` the issuer, a short `exp`) and asks for the audience's project scope with the
 *          jwt-bearer grant; it reuses a token until the skew before expiry and renews it then; callers asking at once
 *          share one request; an issuer refusal is `ServiceTokenRefusedError`, an unreachable or failing issuer
 *          `ServiceTokenUnavailableError`, and neither carries the key, the assertion or a token; a missing or unreadable
 *          key and a missing issuer fail before any request, naming only the setting; an audience that is not a project
 *          id is refused.
 * Boundary: test only; the key pair is generated here and thrown away, `fetch` is stubbed, the clock is fixed and moved
 *           by hand.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0209 (decision 3); RFC 7523; STA-2558.
 */
import { generateKeyPairSync, verify } from "node:crypto";
import { inspect } from "node:util";

import { buildConfig, MemorySecretStoreDriver } from "@stackra/config";
import { Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { ServiceTokensConfig } from "#config/service-tokens.config";
import { ServiceTokens } from "#contracts/index";
import { ServiceTokenRefusedError } from "#core/errors/service-token-refused.error";
import { ServiceTokenUnavailableError } from "#core/errors/service-token-unavailable.error";
import { ZitadelServiceTokensDriver } from "#node/drivers/zitadel-service-tokens.driver";

const ISSUER = "https://id.example.test";
const SERVICE_USER = "312909075212460001";
const KEY_ID = "312909075212460002";
const PAY_PROJECT = "312909075212460003";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs1", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
const KEY_FILE = JSON.stringify({
  type: "serviceaccount",
  keyId: KEY_ID,
  key: privateKey,
  userId: SERVICE_USER,
});

/** A clock the tests move by hand. */
class HandClock extends Driver(Clock) {
  at = new Date("2026-11-08T10:00:00Z");

  now(): Date {
    return new Date(this.at);
  }

  /** Moves the clock on by `seconds`. */
  pass(seconds: number): void {
    this.at = new Date(this.at.getTime() + seconds * 1000);
  }
}

/** What the fake token endpoint saw and answers. */
interface Endpoint {
  readonly requests: URLSearchParams[];
  readonly urls: string[];
}

/** Stubs `fetch` as the issuer's token endpoint, answering `answer` (a token per request by default). */
function tokenEndpoint(
  answer: (count: number) => Promise<Response> | Response = (count) =>
    Response.json({
      access_token: `throwaway-token-${count}`,
      token_type: "Bearer",
      expires_in: 3600,
    }),
): Endpoint {
  const endpoint: Endpoint = { requests: [], urls: [] };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      endpoint.urls.push(url);
      endpoint.requests.push(new URLSearchParams(String(init.body)));
      return answer(endpoint.requests.length);
    }),
  );
  return endpoint;
}

/** A driver over the throwaway key, or over `secret` when given (undefined: no secret set). */
function driverOf(options: { secret?: string | null; issuer?: string } = {}) {
  const config = buildConfig(ServiceTokensConfig, {
    values: { issuer: options.issuer ?? ISSUER, skewSeconds: 60 },
  });
  const secrets = new MemorySecretStoreDriver();
  if (options.secret !== null)
    secrets.set("IDENTITY_SERVICE_ACCOUNT_KEY", options.secret ?? KEY_FILE);
  const clock = new HandClock();
  return { clock, driver: new ZitadelServiceTokensDriver(config, secrets, clock) };
}

/** The decoded part `index` of a JWT. */
const part = (jwt: string, index: number): Record<string, unknown> =>
  JSON.parse(Buffer.from(jwt.split(".")[index] ?? "", "base64url").toString()) as Record<
    string,
    unknown
  >;

/** Expects `error` to name no key, assertion or token, also through its cause. */
function expectNoSecret(error: unknown, endpoint?: Endpoint): void {
  const text = inspect(error, { depth: 6, showHidden: true }) + JSON.stringify(error);
  for (const secret of [
    privateKey,
    KEY_FILE,
    "throwaway-token",
    "BEGIN RSA",
    ...(endpoint?.requests.map((r) => r.get("assertion") ?? "") ?? []),
  ].filter((s) => s !== ""))
    expect(text).not.toContain(secret);
}

describe(ZitadelServiceTokensDriver, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is the ServiceTokens port", () => {
    expect(driverOf().driver).toBeInstanceOf(ServiceTokens);
  });

  it("signs a JWT-profile assertion and asks for the audience's project scope", async () => {
    const endpoint = tokenEndpoint();
    const { driver, clock } = driverOf();
    expect(await driver.for(PAY_PROJECT)).toBe("throwaway-token-1");
    expect(endpoint.urls).toEqual([`${ISSUER}/oauth/v2/token`]);
    const [request] = endpoint.requests;
    expect(request?.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    expect(request?.get("scope")).toBe(`openid urn:zitadel:iam:org:project:id:${PAY_PROJECT}:aud`);
    const assertion = request?.get("assertion") ?? "";
    const [header, claims, signature] = assertion.split(".");
    expect(
      verify(
        "RSA-SHA256",
        Buffer.from(`${header}.${claims}`),
        publicKey,
        Buffer.from(signature ?? "", "base64url"),
      ),
    ).toBe(true);
    expect(part(assertion, 0)).toEqual({ alg: "RS256", kid: KEY_ID });
    const now = Math.floor(clock.at.getTime() / 1000);
    expect(part(assertion, 1)).toEqual({
      iss: SERVICE_USER,
      sub: SERVICE_USER,
      aud: ISSUER,
      iat: now,
      exp: now + 60,
    });
  });

  it("reuses a token until the skew before expiry, then renews it", async () => {
    const endpoint = tokenEndpoint();
    const { driver, clock } = driverOf();
    expect(await driver.for(PAY_PROJECT)).toBe("throwaway-token-1");
    clock.pass(3600 - 61);
    expect(await driver.for(PAY_PROJECT)).toBe("throwaway-token-1");
    expect(endpoint.requests).toHaveLength(1);
    clock.pass(1);
    expect(await driver.for(PAY_PROJECT)).toBe("throwaway-token-2");
    expect(endpoint.requests).toHaveLength(2);
    // another audience has its own token
    expect(await driver.for("312909075212460009")).toBe("throwaway-token-3");
  });

  it("shares one request among callers asking at once", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const endpoint = tokenEndpoint(async (count) => {
      await gate;
      return Response.json({ access_token: `throwaway-token-${count}`, expires_in: 3600 });
    });
    const { driver } = driverOf();
    const calls = [driver.for(PAY_PROJECT), driver.for(PAY_PROJECT), driver.for(PAY_PROJECT)];
    release?.();
    expect(await Promise.all(calls)).toEqual([
      "throwaway-token-1",
      "throwaway-token-1",
      "throwaway-token-1",
    ]);
    expect(endpoint.requests).toHaveLength(1);
  });

  it("answers an issuer refusal with ServiceTokenRefusedError, and keeps nothing", async () => {
    const endpoint = tokenEndpoint(() =>
      Response.json(
        { error: "invalid_grant", error_description: "throwaway-token-x is not valid" },
        { status: 400 },
      ),
    );
    const { driver } = driverOf();
    const refusal = await driver.for(PAY_PROJECT).catch((error: unknown) => error);
    expect(isRefusal(refusal, ServiceTokenRefusedError)).toBe(true);
    expectNoSecret(refusal, endpoint);
    await driver.for(PAY_PROJECT).catch(() => undefined);
    expect(endpoint.requests).toHaveLength(2);
    const empty = tokenEndpoint(() => Response.json({ token_type: "Bearer" }));
    const noToken = await driverOf()
      .driver.for(PAY_PROJECT)
      .catch((error: unknown) => error);
    expect(isRefusal(noToken, ServiceTokenRefusedError)).toBe(true);
    expectNoSecret(noToken, empty);
  });

  it("answers an unreachable, throttling or failing issuer with ServiceTokenUnavailableError", async () => {
    for (const answer of [
      () => Promise.reject(new TypeError("fetch failed")),
      () => new Response("slow down", { status: 429 }),
      () => new Response("down", { status: 503 }),
    ]) {
      const endpoint = tokenEndpoint(answer);
      const outage = await driverOf()
        .driver.for(PAY_PROJECT)
        .catch((error: unknown) => error);
      expect(isRefusal(outage, ServiceTokenUnavailableError)).toBe(true);
      expect((outage as ServiceTokenUnavailableError).retryable).toBe(true);
      expectNoSecret(outage, endpoint);
    }
  });

  it("fails before any request on a missing or unreadable key or no issuer, naming only the setting", async () => {
    const endpoint = tokenEndpoint();
    for (const [options, message] of [
      [{ secret: null }, /IDENTITY_SERVICE_ACCOUNT_KEY is not set/],
      [
        { secret: "{not json, BEGIN RSA throwaway" },
        /IDENTITY_SERVICE_ACCOUNT_KEY is not a ZITADEL key file/,
      ],
      [
        {
          secret: JSON.stringify({
            keyId: KEY_ID,
            key: "BEGIN RSA throwaway",
            userId: SERVICE_USER,
          }),
        },
        /no usable RSA key/,
      ],
      [{ issuer: "" }, /ServiceTokensConfig.issuer is not set/],
    ] as const) {
      const failure = await driverOf(options)
        .driver.for(PAY_PROJECT)
        .catch((error: unknown) => error);
      expect(String((failure as Error).message)).toMatch(message);
      expectNoSecret(failure);
    }
    expect(endpoint.requests).toHaveLength(0);
  });

  it("refuses an audience that is not a project id, so nothing reaches the scope", async () => {
    const endpoint = tokenEndpoint();
    await expect(
      driverOf().driver.for("123 urn:zitadel:iam:org:project:id:zitadel:aud"),
    ).rejects.toThrow(TypeError);
    expect(endpoint.requests).toHaveLength(0);
  });
});
