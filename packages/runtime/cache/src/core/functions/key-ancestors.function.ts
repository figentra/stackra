/**
 * Stackra file contract:
 * Purpose: `keyAncestors`, the keys that cover a key, shortest first: `Product` and `Product:prd_1` for
 *          `Product:prd_1:en`. A stored cache indexes a key under each, so `forget` of any of them finds it without a
 *          scan.
 * Boundary: internal to the package; pure string work over a key from `CacheKey.of`, without the namespace. The key
 *           itself is not among them. Parts are URI-encoded, so `:` only ever separates parts.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2); ADR 0305 (rule 32).
 */

/** The separator `CacheKey.of` puts between parts. */
const SEPARATOR = ":";

/** Every proper prefix of `key` by whole parts, shortest first. */
export function keyAncestors(key: string): readonly string[] {
  const parts = key.split(SEPARATOR);
  const ancestors: string[] = [];
  for (let length = 1; length < parts.length; length += 1)
    ancestors.push(parts.slice(0, length).join(SEPARATOR));
  return ancestors;
}
