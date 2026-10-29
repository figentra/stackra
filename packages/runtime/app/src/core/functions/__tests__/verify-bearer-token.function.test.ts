/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyBearerToken`: it returns the claims of an RS256 and an ES256 token signed by a known
 *          key with the right issuer and audience (string or array) inside its times, the leeway included; it refuses
 *          an expired token, a token not valid yet, a wrong audience, a wrong issuer, an unknown `kid`, `alg: none`,
 *          HS256, a key whose type does not fit the algorithm, a tampered payload, a malformed token, and every token
 *          while the issuer or audience is not configured.
 * Boundary: test only; real Web Crypto key pairs generated per run, and a key source over them.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0206 (decision 8); RFC 7515; RFC 8725.
 */
import { describe, expect, it } from "@stackra/testing";

import { verifyBearerToken } from "#core/functions/verify-bearer-token.function";

const ISSUER = "https://auth.example.test";
const AUDIENCE = "project-1";
const NOW = new Date("2026-10-29T12:00:00Z");
const SECONDS = Math.floor(NOW.getTime() / 1000);

/** base64url of bytes or of a JSON value. */
const b64 = (value: Uint8Array | object): string =>
  btoa(
    String.fromCodePoint(
      ...(value instanceof Uint8Array ? value : new TextEncoder().encode(JSON.stringify(value))),
    ),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const rsa = await crypto.subtle.generateKey(
  {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  },
  true,
  ["sign", "verify"],
);
const ec = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
  "sign",
  "verify",
]);
const jwks: Record<string, JsonWebKey> = {
  rsa: await crypto.subtle.exportKey("jwk", rsa.publicKey),
  ec: await crypto.subtle.exportKey("jwk", ec.publicKey),
};

/** A token signed with the RSA (RS256) or EC (ES256) key, `kid` naming the key. */
async function token(
  claims: Record<string, unknown>,
  { alg = "RS256", kid = alg === "ES256" ? "ec" : "rsa" }: { alg?: string; kid?: string } = {},
): Promise<string> {
  const signing = `${b64({ alg, kid, typ: "JWT" })}.${b64(claims)}`;
  const data = new TextEncoder().encode(signing);
  const signature =
    alg === "ES256"
      ? await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, ec.privateKey, data)
      : await crypto.subtle.sign("RSASSA-PKCS1-v1_5", rsa.privateKey, data);
  return `${signing}.${b64(new Uint8Array(signature))}`;
}

const valid = { iss: ISSUER, aud: AUDIENCE, sub: "u1", exp: SECONDS + 300, iat: SECONDS };

const verify = (jwt: string, overrides: Partial<{ issuer: string; audience: string }> = {}) =>
  verifyBearerToken(jwt, {
    issuer: ISSUER,
    audience: AUDIENCE,
    leewaySeconds: 60,
    now: NOW,
    keys: async (kid) => jwks[kid] ?? null,
    ...overrides,
  });

describe("verifyBearerToken", () => {
  it("returns the claims of a valid RS256 token", async () => {
    expect(await verify(await token(valid))).toEqual(valid);
  });

  it("returns the claims of a valid ES256 token", async () => {
    expect(await verify(await token(valid, { alg: "ES256" }))).toEqual(valid);
  });

  it("accepts an audience array that names the audience", async () => {
    const claims = { ...valid, aud: ["other", AUDIENCE] };
    expect(await verify(await token(claims))).toEqual(claims);
  });

  it("accepts a token expired within the leeway", async () => {
    expect(await verify(await token({ ...valid, exp: SECONDS - 30 }))).toBeDefined();
  });

  it("refuses an expired token", async () => {
    expect(await verify(await token({ ...valid, exp: SECONDS - 61 }))).toBeUndefined();
  });

  it("refuses a token without exp", async () => {
    const { exp: _exp, ...claims } = valid;
    expect(await verify(await token(claims))).toBeUndefined();
  });

  it("refuses a token not valid yet", async () => {
    expect(await verify(await token({ ...valid, nbf: SECONDS + 120 }))).toBeUndefined();
  });

  it("refuses a wrong audience", async () => {
    expect(await verify(await token({ ...valid, aud: "project-2" }))).toBeUndefined();
  });

  it("refuses a wrong issuer", async () => {
    expect(await verify(await token({ ...valid, iss: "https://evil.test" }))).toBeUndefined();
  });

  it("refuses an unknown kid", async () => {
    expect(await verify(await token(valid, { kid: "gone" }))).toBeUndefined();
  });

  it("refuses alg none", async () => {
    const unsigned = `${b64({ alg: "none", kid: "rsa" })}.${b64(valid)}.`;
    expect(await verify(unsigned)).toBeUndefined();
  });

  it("refuses HS256, even keyed with the public key's bytes", async () => {
    const signing = `${b64({ alg: "HS256", kid: "rsa" })}.${b64(valid)}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(JSON.stringify(jwks["rsa"])),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signing));
    expect(await verify(`${signing}.${b64(new Uint8Array(mac))}`)).toBeUndefined();
  });

  it("refuses a key whose type does not fit the algorithm", async () => {
    expect(await verify(await token(valid, { alg: "ES256", kid: "rsa" }))).toBeUndefined();
  });

  it("refuses a tampered payload", async () => {
    const [head, , signed] = (await token(valid)).split(".");
    expect(await verify(`${head}.${b64({ ...valid, sub: "admin" })}.${signed}`)).toBeUndefined();
  });

  it("refuses a malformed token", async () => {
    expect(await verify("not-a-jwt")).toBeUndefined();
    expect(await verify("a.b.c")).toBeUndefined();
  });

  it("refuses every token while the issuer or audience is unset", async () => {
    const jwt = await token(valid);
    expect(await verify(jwt, { issuer: "" })).toBeUndefined();
    expect(await verify(jwt, { audience: "" })).toBeUndefined();
  });
});
