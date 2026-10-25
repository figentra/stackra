/**
 * Stackra file contract:
 * Purpose: `coversKey`, the one rule of which stored keys a `forget` drops: the key itself and every key that extends
 *          it by whole parts.
 * Boundary: internal to the package (drivers use it); pure string comparison over keys from `CacheKey.of`, optionally
 *           behind the same namespace prefix.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 32); ADR 0150 (decision 2).
 */

/** The separator `CacheKey.of` puts between parts; parts are URI-encoded, so it never appears inside one. */
const SEPARATOR = ":";

/** Whether forgetting `parent` drops `key`: they are equal, or `key` starts with `parent` and a separator. */
export function coversKey(parent: string, key: string): boolean {
  return key === parent || key.startsWith(parent + SEPARATOR);
}
