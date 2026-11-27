/**
 * Stackra file contract:
 * Purpose: unit tests of `mintDevToken`: a minted token verifies under the dev issuer, the dev audience and
 *          the public key with `verifyBearerToken`, carries the user's id as `sub` and the identity claims (realm,
 *          scope path, memberships, permissions), lives one hour by default or the ttl given, and fails under another
 *          key, another audience or after it expires; the mint refuses a user id that is not `usr_`, a ttl outside 1 to
 *          86,400 seconds and a public key.
 * Boundary: test only; real Web Crypto ES256 keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer).
 */
import { Realm } from "@stackra/contracts";
import { IDENTITY_CLAIMS } from "@stackra/identity";
import { describe, expect, it } from "@stackra/testing";

import { DEV_ISSUER } from "#core/constants/dev-issuer.constant";
import { createDevIssuerKey } from "#core/functions/create-dev-issuer-key.function";
import { mintDevToken } from "#core/functions/mint-dev-token.function";
import { verifyBearerToken } from "#core/functions/verify-bearer-token.function";

const USER_ID = "usr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const SCOPE_ID = "scp_01j9z3k4m5n6p7q8r9s0t1v2w6";
const NOW = new Date("2026-11-26T12:00:00Z");

const key = await createDevIssuerKey();

/** The claims of `token` under the dev issuer and `publicKey`, at `now`. */
const verify = (
  token: string,
  { publicKey = key.publicKey, audience = DEV_ISSUER.audience as string, now = NOW } = {},
) =>
  verifyBearerToken(token, {
    issuer: DEV_ISSUER.issuer,
    audience,
    leewaySeconds: 0,
    now,
    keys: async (kid) => (kid === publicKey.kid ? publicKey : null),
  });

describe(mintDevToken, () => {
  it("mints a token the dev issuer's public key verifies, with the identity claims", async () => {
    const token = await mintDevToken(key.privateKey, {
      userId: USER_ID,
      realm: Realm.Staff,
      scopePath: "platform.acme",
      memberships: [{ scopeId: SCOPE_ID, path: "platform.acme", name: "Acme", roles: ["owner"] }],
      permissions: ["note.create"],
      email: "dev@example.test",
      now: NOW,
    });
    const claims = await verify(token);
    expect(claims).toMatchObject({
      iss: DEV_ISSUER.issuer,
      aud: DEV_ISSUER.audience,
      sub: USER_ID,
      exp: Math.floor(NOW.getTime() / 1000) + 3600,
      email: "dev@example.test",
      [IDENTITY_CLAIMS.userId]: USER_ID,
      [IDENTITY_CLAIMS.realm]: Realm.Staff,
      [IDENTITY_CLAIMS.scopePath]: "platform.acme",
      [IDENTITY_CLAIMS.memberships]: [
        { scopeId: SCOPE_ID, path: "platform.acme", name: "Acme", roles: ["owner"] },
      ],
      [IDENTITY_CLAIMS.permissions]: ["note.create"],
    });
    expect(JSON.parse(atob(token.split(".")[0] ?? ""))).toEqual({
      alg: "ES256",
      typ: "JWT",
      kid: key.publicKey.kid,
    });
  });

  it("lives the ttl it is given and fails after it", async () => {
    const token = await mintDevToken(key.privateKey, {
      userId: USER_ID,
      realm: Realm.Customer,
      ttlSeconds: 60,
      now: NOW,
    });
    expect(await verify(token, { now: new Date(NOW.getTime() + 59_000) })).toBeDefined();
    expect(await verify(token, { now: new Date(NOW.getTime() + 61_000) })).toBeUndefined();
  });

  it("does not verify under another key or for another audience", async () => {
    const token = await mintDevToken(key.privateKey, {
      userId: USER_ID,
      realm: Realm.Staff,
      now: NOW,
    });
    const other = await createDevIssuerKey();
    expect(
      await verify(token, { publicKey: { ...other.publicKey, kid: key.publicKey.kid } }),
    ).toBeUndefined();
    expect(await verify(token, { audience: "project-1" })).toBeUndefined();
  });

  it("refuses a user id that is not usr_, a ttl out of range and a public key", async () => {
    await expect(
      mintDevToken(key.privateKey, { userId: "admin", realm: Realm.Staff }),
    ).rejects.toThrow(TypeError);
    for (const ttlSeconds of [0, 86_401, 1.5])
      await expect(
        mintDevToken(key.privateKey, { userId: USER_ID, realm: Realm.Staff, ttlSeconds }),
      ).rejects.toThrow(TypeError);
    await expect(
      mintDevToken(key.publicKey, { userId: USER_ID, realm: Realm.Staff }),
    ).rejects.toThrow(TypeError);
  });
});
