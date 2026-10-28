/**
 * Stackra file contract:
 * Purpose: `sameText`, whether two strings are equal, comparing every character whatever the first difference, so a
 *          PIN or key check takes the same time for a near miss as for a wild guess.
 * Boundary: internal and pure; different lengths answer `false` after a full pass over the longer one.
 * Runtime: isomorphic
 * Governing contract: ADR 0361 (decision 8); ADR 0278 (decision 3).
 */

/**
 * Whether `a` equals `b`, in time that depends on the length only.
 *
 * @example
 * sameText(await hashStaffPin(pin, salt, n), stored.hash);
 */
export function sameText(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let difference = a.length ^ b.length;
  for (let index = 0; index < length; index += 1)
    // oxlint-disable-next-line unicorn/prefer-code-point -- compares UTF-16 code units index by index, so a surrogate pair is two units on both sides
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  return difference === 0;
}
