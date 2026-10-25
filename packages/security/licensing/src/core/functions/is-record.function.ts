/**
 * Stackra file contract:
 * Purpose: `isRecord`, whether a parsed JSON value is an object (not `null`, not an array), so the licence dataset and
 *          the Keygen response are read field by field without a cast.
 * Boundary: internal; not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 1).
 */

/**
 * Narrows `value` to a plain record.
 *
 * @example
 * isRecord({ a: 1 }); // true
 * isRecord([1]); // false
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
