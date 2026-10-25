/**
 * Stackra file contract:
 * Purpose: `currentRows`, the rows of a `HasCorrections` read that no other row of the read corrects: the latest
 *          correction of each chain, and every row nothing corrects.
 * Boundary: pure; keeps the order it is given. A chain is resolved only as far as the read holds it, so a read that
 *           must resolve a whole chain loads it whole.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (2026-10-24 amendment: reads resolve to the latest correction).
 */

/**
 * The current rows of `rows`.
 *
 * @example
 * currentRows([original, correction]); // [correction]
 */
export function currentRows<R extends { readonly id: string; readonly corrects: string | null }>(
  rows: readonly R[],
): R[] {
  const corrected = new Set(rows.map((row) => row.corrects).filter((id) => id !== null));
  return rows.filter((row) => !corrected.has(row.id));
}
