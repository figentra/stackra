/**
 * Stackra file contract:
 * Purpose: unit tests of `CallAuthenticator`, booted through `createApp` the way a host is: a valid user token is the
 *          user actor and a valid service account token the service actor of its principal, each with Encore's
 *          `userID`; with no `ServicePrincipals` driver bound, a user token still passes and every service token is
 *          refused (never a 500); a service bearer with a valid forwarded user token is that service acting for the
 *          user (`onBehalfOf`), in the user's tenant, and nothing it answers carries the forwarded token; no token, a
 *          non-bearer scheme, an expired token, a wrong audience, an unknown service subject and malformed claims are
 *          each one `BearerTokenInvalidError`, and so are an expired forward, a forward for another audience, a
 *          forward for another tenant than the service's, a forwarded service token, a forward with no service bearer
 *          and a forward beside a user bearer; no refusal carries a token; a key source that cannot reach the issuer
 *          throws its own error.
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

/** A user's token issued for a scope: the service principal's tenant, or another one. */
const scopedUser = (scopeId: string) => ({
  ...userClaims,
  [IDENTITY_CLAIMS.scopePath]: "platform.acme",
  [IDENTITY_CLAIMS.memberships]: [
    { scopeId, path: "platform.acme", name: "Acme", roles: ["customer"] },
  ],
});
const OTHER_SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w7";

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

  it("authenticates a service bearer with a forwarded user token as the service acting for the user", async () => {
    const forwarded = await token(scopedUser(SERVICE_SCOPE_ID));
    const answer = await authenticate({
      authorization: await bearer(serviceClaims),
      onBehalfOf: forwarded,
    });
    expect(answer).toEqual({
      userID: SERVICE_ID,
      actor: {
        kind: ActorKind.Service,
        id: SERVICE_ID,
        scopeId: SERVICE_SCOPE_ID,
        onBehalfOf: {
          kind: ActorKind.User,
          id: USER_ID,
          realm: Realm.Customer,
          scopeId: SERVICE_SCOPE_ID,
        },
      },
    });
    // only the derived user travels: nothing answered carries the forwarded token or a part of it
    const text = JSON.stringify(answer);
    for (const part of forwarded.split(".")) expect(text).not.toContain(part);
  });

  it("refuses an expired forward, never extending it", async () => {
    await refuses({
      authorization: await bearer(serviceClaims),
      onBehalfOf: await token({ ...userClaims, exp: now - 600 }),
    });
  });

  it("refuses a forward for another audience than this product's project", async () => {
    await refuses({
      authorization: await bearer(serviceClaims),
      onBehalfOf: await token({ ...userClaims, aud: "project-2" }),
    });
  });

  it("refuses a forward for another tenant than the service principal's", async () => {
    await refuses({
      authorization: await bearer(serviceClaims),
      onBehalfOf: await token(scopedUser(OTHER_SCOPE_ID)),
    });
  });

  it("refuses a forwarded service token", async () => {
    await refuses({
      authorization: await bearer(serviceClaims),
      onBehalfOf: await token(serviceClaims),
    });
  });

  it("refuses a forward with no service bearer", async () => {
    await refuses({ onBehalfOf: await token(userClaims) });
    await refuses({ authorization: "Basic dTpw", onBehalfOf: await token(userClaims) });
  });

  it("refuses a forward beside a user bearer", async () => {
    await refuses({
      authorization: await bearer(userClaims),
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
