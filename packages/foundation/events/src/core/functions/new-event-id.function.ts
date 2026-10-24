/**
 * Stackra file contract:
 * Purpose: `newEventId`, the id of an occurrence that came with none: `evt_` and 26 Crockford base-32 characters.
 * Boundary: draws from `crypto.getRandomValues`, so `freezeIds()` from `@stackra/testing` makes the ids repeat in a
 *           test. Internal: the bus calls it; not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids: `<prefix>_<26 characters>`); ADR 0141 (decision 2: the envelope `id`).
 */

/** Crockford's base-32 alphabet: no I, L, O or U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * A fresh event id.
 *
 * @example
 * newEventId(); // "evt_7ZK3Q0M4V9TBN1XG5RD2HC8WPA"
 */
export function newEventId(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(26));
  // 256 is a multiple of 32, so `% 32` keeps every character equally likely.
  return `evt_${Array.from(bytes, (byte) => ALPHABET[byte % 32]).join("")}`;
}
