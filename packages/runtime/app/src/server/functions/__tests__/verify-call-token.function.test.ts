/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyCallToken`: under `stackra dev` (dev keys, running environment `dev`) a dev token
 *          verifies and a token of the configured issuer still does; with no dev keys (every deployed environment) a
 *          dev token is refused, even one whose `kid` the configured issuer's key source knows; a dev token signed by
 *          another dev key, edited after signing, or expired is refused; dev keys in any running environment other
 *          than `dev` throw `ConfigInvalidError` instead of verifying anything, and `STACKRA_ENVIRONMENT=dev` in the
 *          configuration's own environment turns nothing on (only the environment argument counts, STA-2844).
 * Boundary: test only; real Web Crypto ES256 keys, the memory key driver for the configured issuer.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer); ADR 0296 (amendment
 *                     2026-11-26); STA-2844.
 */
import { buildConfig, ConfigInvalidError, StackraEnvironment } from "@stackra/config";
import { Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { BearerConfig } from "#config/bearer.config";
import { createDevIssuerKey } from "#core/functions/create-dev-issuer-key.function";
import { mintDevToken } from "#core/functions/mint-dev-token.function";
import { MemoryJsonWebKeysDriver } from "#server/drivers/memory-json-web-keys.driver";
import { verifyCallToken } from "#server/functions/verify-call-token.function";

const ISSUER = "https://auth.example.test";
const AUDIENCE = "project-1";
const USER_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";

const dev = await createDevIssuerKey();
const real = await createDevIssuerKey();
const DEV_SET = JSON.stringify({ keys: [dev.publicKey] });

/** The configured issuer's keys: `real`'s public half. */
const issuerKeys = new MemoryJsonWebKeysDriver();
issuerKeys.keys = [real.publicKey];

/** The bearer configuration of a process with `env`. */
const configOf = (env: Record<string, string>) =>
  buildConfig(BearerConfig, {
    env: { STACKRA_BEARER_ISSUER: ISSUER, STACKRA_BEARER_AUDIENCE: AUDIENCE, ...env },
  });

const withDevKeys = configOf({ STACKRA_DEV_ISSUER_KEYS: DEV_SET });
const deployed = configOf({});
const { Dev, Production } = StackraEnvironment;

/** A token of the configured issuer, signed with `real`'s private key. */
async function issuerToken(): Promise<string> {
  const minted = await mintDevToken(real.privateKey, { userId: USER_ID, realm: Realm.Staff });
  const [head = "", body = ""] = minted.split(".");
  const claims = {
    ...JSON.parse(atob(body.replaceAll("-", "+").replaceAll("_", "/"))),
    iss: ISSUER,
    aud: AUDIENCE,
  };
  const payload = btoa(JSON.stringify(claims))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  const key = await crypto.subtle.importKey(
    "jwk",
    real.privateKey,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: "ECDSA", hash: "SHA-256" },
      key,
      new TextEncoder().encode(`${head}.${payload}`),
    ),
  );
  const encoded = btoa(String.fromCodePoint(...signature))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
  return `${head}.${payload}.${encoded}`;
}

describe(verifyCallToken, () => {
  it("verifies a dev token under stackra dev", async () => {
    const token = await mintDevToken(dev.privateKey, { userId: USER_ID, realm: Realm.Staff });
    expect(await verifyCallToken(token, withDevKeys, issuerKeys, Dev)).toMatchObject({
      sub: USER_ID,
    });
  });

  it("still verifies the configured issuer's token under stackra dev", async () => {
    expect(await verifyCallToken(await issuerToken(), withDevKeys, issuerKeys, Dev)).toMatchObject({
      iss: ISSUER,
      sub: USER_ID,
    });
  });

  it("refuses a dev token where no dev keys are set, as in every deployed environment", async () => {
    const token = await mintDevToken(dev.privateKey, { userId: USER_ID, realm: Realm.Staff });
    expect(await verifyCallToken(token, deployed, issuerKeys, Production)).toBeUndefined();
    // even when the configured issuer's key source knows the dev key's kid: the dev issuer and audience are not its
    const knowing = new MemoryJsonWebKeysDriver();
    knowing.keys = [dev.publicKey];
    expect(await verifyCallToken(token, deployed, knowing, Production)).toBeUndefined();
    expect(
      await verifyCallToken(await issuerToken(), deployed, issuerKeys, Production),
    ).toBeDefined();
  });

  it("refuses a dev token of another dev key, edited after signing, or expired", async () => {
    const stranger = await createDevIssuerKey();
    const foreign = await mintDevToken(
      { ...stranger.privateKey, kid: dev.privateKey.kid },
      { userId: USER_ID, realm: Realm.Staff },
    );
    expect(await verifyCallToken(foreign, withDevKeys, issuerKeys, Dev)).toBeUndefined();
    const expired = await mintDevToken(dev.privateKey, {
      userId: USER_ID,
      realm: Realm.Staff,
      ttlSeconds: 1,
      now: new Date(Date.now() - 3_600_000),
    });
    expect(await verifyCallToken(expired, withDevKeys, issuerKeys, Dev)).toBeUndefined();
    // a dev token edited to name the configured audience fails the dev key's signature and is not the issuer's
    const [head = "", body = "", signature = ""] = (
      await mintDevToken(dev.privateKey, { userId: USER_ID, realm: Realm.Staff })
    ).split(".");
    const claims = JSON.parse(atob(body.replaceAll("-", "+").replaceAll("_", "/")));
    const retargeted = btoa(JSON.stringify({ ...claims, aud: AUDIENCE })).replace(/=+$/, "");
    expect(
      await verifyCallToken(`${head}.${retargeted}.${signature}`, withDevKeys, issuerKeys, Dev),
    ).toBeUndefined();
  });

  it("throws instead of verifying when dev keys are set outside dev", async () => {
    const token = await mintDevToken(dev.privateKey, { userId: USER_ID, realm: Realm.Staff });
    for (const environment of [
      StackraEnvironment.Test,
      StackraEnvironment.Preview,
      StackraEnvironment.Staging,
      Production,
    ])
      await expect(verifyCallToken(token, withDevKeys, issuerKeys, environment)).rejects.toThrow(
        ConfigInvalidError,
      );
  });

  it("never takes the environment from the configuration's own variables", async () => {
    const token = await mintDevToken(dev.privateKey, { userId: USER_ID, realm: Realm.Staff });
    // STACKRA_ENVIRONMENT=dev beside the keys once turned dev sign-in on through app.bearer.environment
    const claimsDev = configOf({ STACKRA_DEV_ISSUER_KEYS: DEV_SET, STACKRA_ENVIRONMENT: "dev" });
    expect(claimsDev).not.toHaveProperty("environment");
    await expect(verifyCallToken(token, claimsDev, issuerKeys, Production)).rejects.toThrow(
      ConfigInvalidError,
    );
  });
});
