/**
 * Stackra file contract:
 * Purpose: `hmacKey`, the Web Crypto HMAC-SHA-256 key over the raw bytes a key source hands out, for signing and
 *          constant-time verifying signed tokens and one-time codes.
 * Boundary: internal to @stackra/support (not re-exported). The key is not extractable; the bytes are never logged.
 * Runtime: isomorphic (Web Crypto)
 * Governing contract: ADR 0305 (one declaration per file); ADR 0173 (nobody reads a value).
 */

/** An HMAC-SHA-256 `CryptoKey` for `bytes`, usable to sign and verify. */
export function hmacKey(bytes: Uint8Array): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    new Uint8Array(bytes), // a copy over a plain ArrayBuffer, as Web Crypto typings want
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}
