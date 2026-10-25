/**
 * Stackra file contract:
 * Purpose: unit tests of the Web Push helpers: `base64url` round-trips; `vapidAuthorization` makes an ES256 JWT for the
 *          push service's origin that verifies with the public key; `encryptWebPush` writes the `aes128gcm` header and a
 *          body the subscriber decrypts back to the payload (RFC 8291 done from the receiving side).
 * Boundary: test only; every key is generated in the test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; RFC 8291; RFC 8292.
 */
import { describe, expect, it } from "@stackra/testing";

import { base64url } from "#core/functions/base64url.function";
import { encryptWebPush } from "#core/functions/encrypt-web-push.function";
import { vapidAuthorization } from "#core/functions/vapid-authorization.function";

const encoder = new TextEncoder();

async function hkdf(
  salt: Uint8Array<ArrayBuffer>,
  ikm: ArrayBuffer,
  info: Uint8Array<ArrayBuffer>,
  bytes: number,
) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8);
}

describe("base64url", () => {
  it("round-trips without padding", () => {
    const bytes = new Uint8Array([251, 255, 0, 1]);
    expect(base64url(bytes)).toBe("-_8AAQ");
    expect([...base64url.decode("-_8AAQ")]).toEqual([...bytes]);
  });
});

describe("vapidAuthorization", () => {
  it("signs a JWT for the endpoint's origin", async () => {
    const pair = (await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
      "sign",
      "verify",
    ])) as CryptoKeyPair;
    const publicKey = base64url(await crypto.subtle.exportKey("raw", pair.publicKey));
    const { d } = await crypto.subtle.exportKey("jwk", pair.privateKey);
    const header = await vapidAuthorization({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc",
      publicKey,
      privateKey: d ?? "",
      subject: "mailto:push@platform.example",
      now: new Date("2026-10-25T00:00:00Z"),
    });
    const [, token = "", key = ""] = /^vapid t=([^,]+), k=(.+)$/.exec(header) ?? [];
    expect(key).toBe(publicKey);
    const [head = "", claims = "", signature = ""] = token.split(".");
    expect(JSON.parse(new TextDecoder().decode(base64url.decode(claims)))).toEqual({
      aud: "https://fcm.googleapis.com",
      exp: Date.parse("2026-10-25T12:00:00Z") / 1000,
      sub: "mailto:push@platform.example",
    });
    const valid = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      pair.publicKey,
      base64url.decode(signature),
      encoder.encode(`${head}.${claims}`),
    );
    expect(valid).toBe(true);
  });
});

describe("encryptWebPush", () => {
  it("encrypts a body the subscriber can decrypt", async () => {
    const user = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
      "deriveBits",
    ])) as CryptoKeyPair;
    const userPublic = new Uint8Array(await crypto.subtle.exportKey("raw", user.publicKey));
    const auth = crypto.getRandomValues(new Uint8Array(16));
    const body = await encryptWebPush('{"title":"Hi"}', {
      p256dh: base64url(userPublic),
      auth: base64url(auth),
    });

    const salt = body.slice(0, 16);
    expect(new DataView(body.buffer).getUint32(16)).toBe(4096);
    expect(body[20]).toBe(65);
    const senderPublic = body.slice(21, 86);
    const sender = await crypto.subtle.importKey(
      "raw",
      senderPublic,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    );
    const shared = await crypto.subtle.deriveBits(
      { name: "ECDH", public: sender },
      user.privateKey,
      256,
    );
    const info = new Uint8Array([
      ...encoder.encode("WebPush: info\0"),
      ...userPublic,
      ...senderPublic,
    ]);
    const ikm = await hkdf(auth, shared, info, 32);
    const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
    const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);
    const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["decrypt"]);
    const plain = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(nonce) },
        aes,
        body.slice(86),
      ),
    );
    expect(plain.at(-1)).toBe(2);
    expect(new TextDecoder().decode(plain.slice(0, -1))).toBe('{"title":"Hi"}');
  });

  it("refuses a payload larger than one record", async () => {
    await expect(encryptWebPush("x".repeat(4096), { p256dh: "AA", auth: "AA" })).rejects.toThrow(
      RangeError,
    );
  });
});
