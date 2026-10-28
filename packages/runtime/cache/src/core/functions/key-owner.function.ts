/**
 * Stackra file contract:
 * Purpose: `keyOwner`, the owner of a cache key (its first part, the class name `CacheKey.of` was given), the label a
 *          `CacheMetric` is counted under.
 * Boundary: internal to the package; pure string work over a key from `CacheKey.of`, without the namespace.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 4); ADR 0305 (rule 32).
 */

/** The part of `key` before its first `:`, or the whole key when it has one part. */
export function keyOwner(key: string): string {
  const end = key.indexOf(":");
  return end === -1 ? key : key.slice(0, end);
}
