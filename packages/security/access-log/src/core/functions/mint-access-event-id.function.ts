/**
 * Stackra file contract:
 * Purpose: `mintAccessEventId()`, a fresh integration-event id (`evt_` and 26 random Crockford base32 characters) for
 *          the `AccessRecorded` events the outbox sink writes.
 * Boundary: uses `crypto.getRandomValues` only; the outbox refuses an event id without the `evt_` prefix, so the form
 *           matches @stackra/events' own minting (which that package keeps internal). Internal to this package.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public id format); ADR 0141 (decision 2: the envelope id).
 */

/** Crockford base32: no I, L, O or U. */
const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * A new event id.
 *
 * @example
 * mintAccessEventId(); // "evt_01j9z3k4m5n6p7q8r9s0t1v2w3"
 */
export function mintAccessEventId(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(26));
  // 256 is a multiple of 32, so `% 32` keeps every character equally likely.
  return `evt_${Array.from(bytes, (byte) => ALPHABET[byte % 32]).join("")}`;
}
