/**
 * Stackra file contract:
 * Purpose: unit tests of `signJwt`: an HS256 token verifies with its secret and carries the declared claims and the
 *          expiry, and an RS256 and an ES256 token signed with a PKCS #8 PEM key verify with the public key.
 * Boundary: test only; keys are generated per test with Web Crypto, never fixtures of real keys.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0308 (rule 6); RFC 7519; RFC 7515.
 */
import { describe, expect, it } from "@stackra/testing";

import { encodeBase64 } from "#core/functions/encode-base64.function";
import { signJwt } from "#core/functions/sign-jwt.function";

const NOW = new Date("2026-10-24T09:00:00Z");

/** The bytes of a base64url segment. */
const bytesOf = (segment: string) =>
  Uint8Array.from(atob(segment.replaceAll("-", "+").replaceAll("_", "/")), (character) =>
    character.charCodeAt(0),
  );

/** The parts of a compact token. */
function partsOf(token: string) {
  const [header = "", claims = "", signature = ""] = token.split(".");
  return {
    header: JSON.parse(new TextDecoder().decode(bytesOf(header))) as Record<string, unknown>,
    claims: JSON.parse(new TextDecoder().decode(bytesOf(claims))) as Record<string, unknown>,
    input: new TextEncoder().encode(`${header}.${claims}`),
    signature: bytesOf(signature),
  };
}

/** A PKCS #8 PEM of `key`. */
async function pemOf(key: CryptoKey): Promise<string> {
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", key));
  return `-----BEGIN PRIVATE KEY-----\n${encodeBase64(der)}\n-----END PRIVATE KEY-----\n`;
}

describe("signJwt", () => {
  it("signs HS256 with the declared claims and the expiry", async () => {
    const token = await signJwt(
      {
        algorithm: "HS256",
        key: "{key}",
        keyId: "k1",
        issuer: "stackra",
        audience: "provider",
        expiresIn: "10m",
      },
      (template) => (template === "{key}" ? "shared-secret" : template),
      NOW,
    );
    const { header, claims, input, signature } = partsOf(token);
    expect(header).toEqual({ alg: "HS256", typ: "JWT", kid: "k1" });
    expect(claims).toEqual({
      iss: "stackra",
      aud: "provider",
      iat: 1_792_832_400,
      exp: 1_792_833_000,
    });
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode("shared-secret"),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    await expect(crypto.subtle.verify("HMAC", key, signature, input)).resolves.toBe(true);
  });

  it("signs RS256 and ES256 with a PEM private key", async () => {
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
    const rsaPem = await pemOf(rsa.privateKey);
    const ecPem = await pemOf(ec.privateKey);

    const rs = partsOf(await signJwt({ algorithm: "RS256", key: rsaPem }, (t) => t, NOW));
    const es = partsOf(await signJwt({ algorithm: "ES256", key: ecPem }, (t) => t, NOW));

    await expect(
      crypto.subtle.verify("RSASSA-PKCS1-v1_5", rsa.publicKey, rs.signature, rs.input),
    ).resolves.toBe(true);
    await expect(
      crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        ec.publicKey,
        es.signature,
        es.input,
      ),
    ).resolves.toBe(true);
    expect(es.claims).toEqual({ iat: 1_792_832_400, exp: 1_792_832_700 });
  });

  it("adds extra claims, the declared ones winning", async () => {
    const token = await signJwt(
      { algorithm: "HS256", key: "secret", issuer: "svc@example" },
      (template) => template,
      NOW,
      { scope: "a b", iss: "ignored" },
    );
    expect(partsOf(token).claims).toMatchObject({ scope: "a b", iss: "svc@example" });
  });
});
