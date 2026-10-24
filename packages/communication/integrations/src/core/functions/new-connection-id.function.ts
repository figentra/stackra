/**
 * Stackra file contract:
 * Purpose: `newConnectionId`, the public id of a new connection: `conn_` and 26 Crockford base-32 characters.
 * Boundary: internal; draws from `crypto.getRandomValues`, so `freezeIds()` from `@stackra/testing` makes the ids
 *           repeat in a test. The id is minted before `subscribe()`, because the webhook URL carries it.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (public ids: `<prefix>_<26 characters>`); ADR 0308 (rule 16: the URL carries the id).
 */
import type { PublicId } from "@stackra/contracts";

/** Crockford's base-32 alphabet: no I, L, O or U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * A fresh connection id.
 *
 * @example
 * newConnectionId(); // "conn_7ZK3Q0M4V9TBN1XG5RD2HC8WPA"
 */
export function newConnectionId(): PublicId<"conn"> {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(26));
  // 256 is a multiple of 32, so `% 32` keeps every character equally likely.
  return `conn_${Array.from(bytes, (byte) => ALPHABET[byte % 32]).join("")}`;
}
