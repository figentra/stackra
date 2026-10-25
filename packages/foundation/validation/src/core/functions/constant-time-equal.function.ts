/**
 * Stackra file contract:
 * Purpose: `constantTimeEqual(a, b)`, a string comparison whose time does not depend on where the strings differ, for
 *          digests and codes.
 * Boundary: pure. The length is not secret (digests have a fixed length), so unequal lengths return early.
 * Runtime: isomorphic
 * Governing contract: conflict #2; ADR 0305.
 */

/**
 * Whether `a` equals `b`, compared in constant time.
 *
 * @example
 * constantTimeEqual(stored.digest, await oneTimeCodeDigest(pepper, purpose, subject, input));
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1)
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return difference === 0;
}
