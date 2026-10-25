/**
 * Stackra file contract:
 * Purpose: `mintScheduleId`, a new public id for a stored schedule: `sch_` and a UUIDv7 in Crockford base32, so ids
 *          sort by creation time.
 * Boundary: internal to this package; `SchedulerService.schedule` mints one per schedule. The same encoding as
 *           @stackra/model's public ids, which this package does not depend on.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids); ADR 0231 (prefixed ids).
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base32 alphabet, lowercase: no i, l, o or u. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * A new schedule id.
 *
 * @example
 * mintScheduleId(); // "sch_01jb3m…"
 */
export function mintScheduleId(): PublicId<"sch"> {
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
  return `sch_${body}`;
}
