/**
 * Stackra file contract:
 * Purpose: `mintUploadId`, a fresh upload id: `upl_` and 26 lowercase Crockford base32 characters of a UUIDv7, the form
 *          of every public id.
 * Boundary: internal to this package. The 74 random bits make an id unguessable, which matters: the id is the only
 *           thing an `Upload` token carries. The same layout as @stackra/model's ids, without depending on the ORM.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (public ids `<prefix>_<26 characters>`); RFC 9562 (UUIDv7).
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base32 alphabet, lowercase: no i, l, o or u. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * A new upload id.
 *
 * @example
 * mintUploadId(); // "upl_01jb3m…"
 */
export function mintUploadId(): PublicId<"upl"> {
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
  return `upl_${body}`;
}
