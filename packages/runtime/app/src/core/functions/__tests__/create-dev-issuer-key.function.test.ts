/**
 * Stackra file contract:
 * Purpose: unit tests of `createDevIssuerKey`: a new ES256 key pair shares one `stackra-dev-` `kid`, its public half
 *          has no private member, and two calls never share a `kid`.
 * Boundary: test only; real Web Crypto keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0206 (decision 8, amendment of 2026-11-26: the dev issuer).
 */
import { describe, expect, it } from "@stackra/testing";

import { createDevIssuerKey } from "#core/functions/create-dev-issuer-key.function";

describe(createDevIssuerKey, () => {
  it("makes an ES256 pair under one stackra-dev kid whose public half holds no private member", async () => {
    const key = await createDevIssuerKey();
    expect(key.privateKey.kid).toBe(key.publicKey.kid);
    expect(key.publicKey.kid).toMatch(/^stackra-dev-[0-9a-f]{32}$/);
    expect(key.publicKey).toMatchObject({ kty: "EC", crv: "P-256", alg: "ES256", use: "sig" });
    expect(key.publicKey).not.toHaveProperty("d");
    expect(typeof key.privateKey.d).toBe("string");
  });

  it("never reuses a kid", async () => {
    const [first, second] = await Promise.all([createDevIssuerKey(), createDevIssuerKey()]);
    expect(first.publicKey.kid).not.toBe(second.publicKey.kid);
  });
});
