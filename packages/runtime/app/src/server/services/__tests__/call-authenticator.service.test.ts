/**
 * Stackra file contract:
 * Purpose: unit tests of `CallAuthenticator`, booted through `createApp` the way a host is: a valid user token is the
 *          user actor and a valid service account token the service actor of its principal, each with Encore's
 *          `userID`; with no `ServicePrincipals` driver bound, a user token still passes and every service token is
 *          refused (never a 500); no token, a non-bearer scheme, an expired token, a wrong audience, an unknown
 *          service subject, malformed claims and any `Stackra-On-Behalf-Of` header are each one
 *          `BearerTokenInvalidError`, and the refusal never carries the token; a key source that cannot reach the
 *          issuer throws its own error.
 * Boundary: test only; a real Web Crypto RS256 key pair, a host wiring with the memory key and principal drivers, and
 *           the bearer settings from the environment.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0209 (decision 3 and its 2026-11-07 amendment); ADR 0206 (decision 8).
 */
import { Module } from "@stackra/container";
import type { Wiring } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { IDENTITY_CLAIMS, MemoryServicePrincipalsDriver } from "@stackra/identity";
import { ServicePrincipals } from "@stackra/identity/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { BearerConfig } from "#config/bearer.config";
import { JsonWebKeys } from "#contracts/ports/json-web-keys.port";
import { MemoryJsonWebKeysDriver } from "#server/drivers/memory-json-web-keys.driver";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import { createApp } from "#server/functions/create-app.function";
import { CallAuthenticator } from "#server/services/call-authenticator.service";
import type { CallAuthData } from "#server/types/call-auth-data.type";
import type { CallCredentials } from "#server/types/call-credentials.type";

const ISSUER = "https://auth.example.test";
const AUDIENCE = "project-1";
const USER_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const SERVICE_ID = "svc_01j9z3k4m5n6p7q8r9s0t1v2w5";
const SERVICE_SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w6";
const MACHINE_SUBJECT = "312909075212468999";

const b64 = (value: Uint8Array | object): string =>
  btoa(
    String.fromCodePoint(
      ...(value instanceof Uint8Array ? value : new TextEncoder().encode(JSON.stringify(value))),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

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

/** An RS256 token under key `k1`. */
async function token(claims: Record<string, unknown>): Promise<string> {
  const signing = `${b64({ alg: "RS256", kid: "k1" })}.${b64(claims)}`;
  const mac = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    pair.privateKey,
    new TextEncoder().encode(signing),
  );
  return `${signing}.${b64(new Uint8Array(mac))}`;
}

const now = Math.floor(Date.now() / 1000);
const base = { iss: ISSUER, aud: AUDIENCE, exp: now + 300 };
const userClaims = {
  ...base,
  sub: "312909075212468632",
  [IDENTITY_CLAIMS.userId]: USER_ID,
  [IDENTITY_CLAIMS.realm]: Realm.Customer,
};
const serviceClaims = { ...base, sub: MACHINE_SUBJECT, client_id: "ship" };

const publicKey = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" };

/** The issuer's one key. */
class TestKeys extends MemoryJsonWebKeysDriver {
  override keys = [publicKey];
}

/** An issuer that cannot be reached. */
class UnreachableKeys extends MemoryJsonWebKeysDriver {
  override find(): Promise<JsonWebKey | null> {
    return Promise.reject(new Error("issuer unreachable"));
  }
}

/** The one service principal the host knows. */
class SeededPrincipals extends MemoryServicePrincipalsDriver {
  constructor() {
    super();
    this.seed({
      [MACHINE_SUBJECT]: { id: SERVICE_ID, key: "ship.shipping", scopeId: SERVICE_SCOPE_ID },
    });
  }
}

class ShopModule extends Module({}) {}

/**
 * Authenticates `credentials` in a host booted by `createApp`, its keys from `keys` and, unless `principals` is
 * false, its service principals from `SeededPrincipals`; with false, no `ServicePrincipals` driver is bound.
 */
async function authenticate(
  credentials: CallCredentials,
  {
    keys = TestKeys,
    principals = true,
  }: { keys?: typeof MemoryJsonWebKeysDriver; principals?: boolean } = {},
): Promise<CallAuthData> {
  vi.stubEnv("STACKRA_BEARER_ISSUER", ISSUER);
  vi.stubEnv("STACKRA_BEARER_AUDIENCE", AUDIENCE);
  const wiring: Wiring = {
    member: "shop",
    root: ShopModule,
    modules: { shop: { exports: [], dependsOn: [], type: ShopModule } },
    config: [{ key: "app.bearer", provide: BearerConfig }],
    drivers: [
      { port: JsonWebKeys, key: "app.JsonWebKeys", candidates: { memory: async () => keys } },
      ...(principals
        ? [
            {
              port: ServicePrincipals,
              key: "identity.ServicePrincipals",
              candidates: { memory: async () => SeededPrincipals },
            },
          ]
        : []),
    ],
  };
  const app = await createApp(ShopModule, { wiring });
  try {
    return await app.handlers.run((container) =>
      new CallAuthenticator(container).authenticate(credentials),
    );
  } finally {
    await app.close();
  }
}

/** Expects one refusal that names no part of the presented credentials. */
async function refuses(credentials: CallCredentials): Promise<void> {
  const refusal = await authenticate(credentials).then(
    () => undefined,
    (error: unknown) => error,
  );
  expect(isRefusal(refusal, BearerTokenInvalidError)).toBe(true);
  const text = JSON.stringify(refusal) + String((refusal as Error).message);
  for (const value of Object.values(credentials))
    expect(text).not.toContain(String(value).replace(/^bearer /i, ""));
}

const bearer = async (claims: Record<string, unknown>) => `Bearer ${await token(claims)}`;

describe(CallAuthenticator, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("authenticates a user token as its user actor", async () => {
    expect(await authenticate({ authorization: await bearer(userClaims) })).toEqual({
      userID: USER_ID,
      actor: { kind: ActorKind.User, id: USER_ID, realm: Realm.Customer },
    });
  });

  it("authenticates a service account token as its principal's service actor", async () => {
    expect(await authenticate({ authorization: await bearer(serviceClaims) })).toEqual({
      userID: SERVICE_ID,
      actor: { kind: ActorKind.Service, id: SERVICE_ID, scopeId: SERVICE_SCOPE_ID },
    });
  });

  it("refuses a call with no token", async () => {
    await refuses({});
  });

  it("refuses a non-bearer scheme", async () => {
    await refuses({ authorization: "Basic dTpw" });
  });

  it("refuses an expired token", async () => {
    await refuses({ authorization: await bearer({ ...userClaims, exp: now - 600 }) });
  });

  it("refuses a token for another audience", async () => {
    await refuses({ authorization: await bearer({ ...userClaims, aud: "project-2" }) });
  });

  it("refuses an unknown service subject", async () => {
    await refuses({ authorization: await bearer({ ...serviceClaims, sub: "312909075212460000" }) });
  });

  it("refuses a user token with malformed claims", async () => {
    await refuses({ authorization: await bearer({ ...userClaims, [IDENTITY_CLAIMS.realm]: 7 }) });
  });

  it("refuses a Stackra-On-Behalf-Of header until the forwarded token is verified", async () => {
    await refuses({
      authorization: await bearer(serviceClaims),
      onBehalfOf: await token(userClaims),
    });
  });

  it("with no ServicePrincipals driver bound, passes a user token and refuses every service token", async () => {
    expect(
      await authenticate({ authorization: await bearer(userClaims) }, { principals: false }),
    ).toMatchObject({ userID: USER_ID });
    const refusal = await authenticate(
      { authorization: await bearer(serviceClaims) },
      { principals: false },
    ).then(
      () => undefined,
      (error: unknown) => error,
    );
    expect(isRefusal(refusal, BearerTokenInvalidError)).toBe(true);
  });

  it("lets an unreachable issuer fail as an outage, not a refusal", async () => {
    await expect(
      authenticate({ authorization: await bearer(userClaims) }, { keys: UnreachableKeys }),
    ).rejects.toThrow("issuer unreachable");
  });
});
