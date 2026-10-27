/**
 * Stackra file contract:
 * Purpose: `sameBytes`, whether two byte runs are equal, compared in constant time: both are MACed under a fresh random
 *          key and the MACs are compared by `crypto.subtle.verify`, so neither the length nor the first differing
 *          byte of a guess shows in the timing.
 * Boundary: internal; the token, shared-header and keyed-digest schemes compare through it, never with `===` on a
 *           secret or a signature. The random key lives for one call and is not extractable.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 15); this package's AGENTS.md (compare only through `crypto.subtle.verify`).
 */

/**
 * Compares `expected` and `received`.
 *
 * @example
 * await sameBytes(utf8(secret), utf8(token)); // true only when they are equal
 */
export async function sameBytes(
  expected: Uint8Array<ArrayBuffer>,
  received: Uint8Array<ArrayBuffer>,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, expected);
  return crypto.subtle.verify("HMAC", key, mac, received);
}
