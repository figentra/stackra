/**
 * Stackra file contract:
 * Purpose: `encryptWebPush(payload, target)`, a Web Push message body encrypted for one browser subscription with
 *          `aes128gcm` (RFC 8291 over RFC 8188): an ephemeral ECDH key, the subscription's auth secret, one record.
 * Boundary: Web Crypto only; a fresh key pair and salt per message. The payload must fit one 4096-byte record (the push
 *           services' limit); a larger one is a `RangeError`.
 * Runtime: isomorphic
 * Governing contract: RFC 8291; RFC 8188; ADR 0223 (decision 1: web push with VAPID).
 */
import { base64url } from "@stackra/support";

/** The record size written in the header. */
const RECORD_SIZE = 4096;

const encoder = new TextEncoder();

/** HKDF-SHA-256 of `ikm` with `salt` and `info`, `bytes` long. */
async function hkdf(
  salt: Uint8Array<ArrayBuffer>,
  ikm: ArrayBuffer | Uint8Array<ArrayBuffer>,
  info: Uint8Array<ArrayBuffer>,
  bytes: number,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, key, bytes * 8);
}

/** `parts` joined. */
function concat(...parts: readonly Uint8Array[]): Uint8Array<ArrayBuffer> {
  const joined = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.length;
  }
  return joined;
}

/**
 * The encrypted body for `target`.
 *
 * @throws RangeError when the payload does not fit one record.
 * @example
 * const body = await encryptWebPush(JSON.stringify({ title, body }), { p256dh, auth });
 */
export async function encryptWebPush(
  payload: string,
  target: { readonly p256dh: string; readonly auth: string },
): Promise<Uint8Array<ArrayBuffer>> {
  const plaintext = encoder.encode(payload);
  if (plaintext.length + 1 + 16 + 86 > RECORD_SIZE)
    throw new RangeError("encryptWebPush: the payload is too large");
  const userPublic = base64url.decode(target.p256dh);
  const authSecret = base64url.decode(target.auth);
  const local = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const localPublic = new Uint8Array(await crypto.subtle.exportKey("raw", local.publicKey));
  const userKey = await crypto.subtle.importKey(
    "raw",
    userPublic,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = await crypto.subtle.deriveBits(
    { name: "ECDH", public: userKey },
    local.privateKey,
    256,
  );
  const ikm = await hkdf(
    authSecret,
    shared,
    concat(encoder.encode("WebPush: info\0"), userPublic, localPublic),
    32,
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, encoder.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, encoder.encode("Content-Encoding: nonce\0"), 12);
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(nonce) },
    aes,
    concat(plaintext, new Uint8Array([2])),
  );
  const header = new Uint8Array(21);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, RECORD_SIZE);
  header[20] = localPublic.length;
  return concat(header, localPublic, new Uint8Array(ciphertext));
}
