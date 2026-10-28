/**
 * Stackra file contract:
 * Purpose: `analyticsId`, the ids an analytics delivery carries: a prefix (`evt_`, `anon_`, `ses_`) and 26 lower-case
 *          Crockford base32 characters in the ULID layout (10 for the capture millisecond, 16 random), so ids sort
 *          by time and share the alphabet of the outbox event ids `AiMeter` makes.
 * Boundary: a pure function apart from the clock and the random source. Web Crypto where present; Hermes has no
 *           global Web Crypto, so React Native falls back to `Math.random` (these ids name events and visits, they
 *           guard nothing).
 * Runtime: isomorphic
 * Governing contract: ADR 0298 (decision 5); ADR 0294 (decision 16).
 */

/** Crockford base32: no I, L, O or U. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * A new time-ordered id with `prefix`.
 *
 * @example
 * analyticsId("evt_"); // "evt_01jb9x3k7m2c8q4w6e5r0t1y2z" (shape; the characters differ every call)
 */
export function analyticsId(prefix: string): string {
  let time = Date.now();
  const chars: string[] = [];
  for (let index = 0; index < 10; index += 1) {
    chars.unshift(ALPHABET[time % 32] ?? "0");
    time = Math.floor(time / 32);
  }
  const random = new Uint8Array(16);
  if (typeof globalThis.crypto?.getRandomValues === "function")
    globalThis.crypto.getRandomValues(random);
  else for (let index = 0; index < 16; index += 1) random[index] = Math.floor(Math.random() * 256);
  // 256 is a multiple of 32, so `% 32` keeps every character equally likely.
  for (const byte of random) chars.push(ALPHABET[byte % 32] ?? "0");
  return `${prefix}${chars.join("")}`;
}
