/**
 * Stackra file contract:
 * Purpose: unit tests of `CallAuthenticator`: a valid user token is the user actor and a valid service account token
 *          the service actor of its principal, each with Encore's `userID`; no token, a non-bearer scheme, an expired
 *          token, a wrong audience, an unknown service subject, malformed claims and any `Stackra-On-Behalf-Of` header
 *          are each one `BearerTokenInvalidError`, and the refusal never carries the token; a key source that cannot
 *          reach the issuer throws its own error.
 * Boundary: test only; a real Web Crypto RS256 key pair, the memory key and principal drivers and `buildConfig`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0209 (decision 3 and its 2026-11-07 amendment); ADR 0206 (decision 8).
 */
import { buildConfig } from "@stackra/config";
import { ActorKind, Realm } from "@stackra/contracts";
import { isRefusal } from "@stackra/errors";
import { IDENTITY_CLAIMS, MemoryServicePrincipalsDriver } from "@stackra/identity";
import { describe, expect, it } from "@stackra/testing";

import { BearerConfig } from "#config/bearer.config";
import { MemoryJsonWebKeysDriver } from "#server/drivers/memory-json-web-keys.driver";
import { BearerTokenInvalidError } from "#server/errors/bearer-token-invalid.error";
import { CallAuthenticator } from "#server/services/call-authenticator.service";
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

/** An authenticator over one key and one service principal. */
async function setup(): Promise<{
  authenticator: CallAuthenticator;
  keys: MemoryJsonWebKeysDriver;
}> {
  const config = buildConfig(BearerConfig, {
    env: { STACKRA_BEARER_ISSUER: ISSUER, STACKRA_BEARER_AUDIENCE: AUDIENCE },
  });
  const keys = new MemoryJsonWebKeysDriver();
  keys.keys = [{ ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1" }];
  const principals = new MemoryServicePrincipalsDriver().seed({
    [MACHINE_SUBJECT]: { id: SERVICE_ID, key: "ship.shipping", scopeId: SERVICE_SCOPE_ID },
  });
  return { authenticator: new CallAuthenticator(config, keys, principals), keys };
}

/** Expects one refusal that names no part of the presented credentials. */
async function refuses(credentials: CallCredentials): Promise<void> {
  const { authenticator } = await setup();
  const refusal = await authenticator.authenticate(credentials).then(
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
  it("authenticates a user token as its user actor", async () => {
    const { authenticator } = await setup();
    expect(await authenticator.authenticate({ authorization: await bearer(userClaims) })).toEqual({
      userID: USER_ID,
      actor: { kind: ActorKind.User, id: USER_ID, realm: Realm.Customer },
    });
  });

  it("authenticates a service account token as its principal's service actor", async () => {
    const { authenticator } = await setup();
    expect(
      await authenticator.authenticate({ authorization: await bearer(serviceClaims) }),
    ).toEqual({
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

  it("lets an unreachable issuer fail as an outage, not a refusal", async () => {
    const { authenticator, keys } = await setup();
    keys.find = () => Promise.reject(new Error("issuer unreachable"));
    await expect(
      authenticator.authenticate({ authorization: await bearer(userClaims) }),
    ).rejects.toThrow("issuer unreachable");
  });
});
