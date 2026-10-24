/**
 * Stackra file contract:
 * Purpose: `mintJobId`, a fresh job id: `job_` and 26 lowercase Crockford base32 characters of a UUIDv7, so job ids
 *          sort by creation time.
 * Boundary: internal to this package. Reads `Date.now()` and `crypto.getRandomValues` only, so `freezeClock` and
 *           `freezeIds` in a test make it deterministic. The same layout as @stackra/model's ids, without depending on
 *           the ORM.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (decision 1: public ids); ADR 0231 (`<prefix>_<26 characters>`); RFC 9562 (UUIDv7).
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base32 alphabet, lowercase: no i, l, o or u. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * A new job id.
 *
 * @example
 * mintJobId(); // "job_01jb3m…"
 */
export function mintJobId(): PublicId<"job"> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // UUIDv7: 48-bit big-endian milliseconds, version 7, variant 10.
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
  return `job_${body}`;
}
