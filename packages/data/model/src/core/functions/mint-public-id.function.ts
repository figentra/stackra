/**
 * Stackra file contract:
 * Purpose: `mintPublicId`, which makes a new public id: the prefix, `_`, and the 26 lowercase Crockford base32
 *          characters of a fresh UUIDv7, so ids sort by creation time.
 * Boundary: reads `Date.now()` and `crypto.getRandomValues` only, so `freezeClock` and `freezeIds` in a test make it
 *           deterministic without importing it. The prefix is checked by the `HasPublicId` trait. Internal: not
 *           exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decision 1: format); ADR 0082 (database ids never leave a service).
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base32 alphabet, lowercase: no i, l, o or u. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * A new public id with `prefix`.
 *
 * @example
 * mintPublicId("ord"); // "ord_01jab3k4m5n6p7q8r9s0t1v2w3"
 */
export function mintPublicId<P extends string>(prefix: P): PublicId<P> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // UUIDv7 (RFC 9562): 48-bit big-endian milliseconds, version 7, variant 10.
  let time = Date.now();
  for (let index = 5; index >= 0; index--) {
    bytes[index] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  let body = "";
  for (let index = 0; index < 26; index++) {
    body = ALPHABET.charAt(Number(value & 31n)) + body;
    value >>= 5n;
  }
  return `${prefix}_${body}`;
}
