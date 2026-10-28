/**
 * Stackra file contract:
 * Purpose: `groupingMask(dimensions, kept)`, the value Postgres `grouping(<dimensions>)` returns for the grouping set
 *          that keeps `kept`: one bit per dimension, the first dimension the most significant, set when the set leaves
 *          that dimension out. `0` is the full grouping; every bit set is the grand total.
 * Boundary: internal; pure. The compiler, the page statement and the result builder read the same masks, so a row's
 *           `"~grouping"` says which set (group, subtotal level or pivot margin) it belongs to.
 * Runtime: node
 * Governing contract: ADR 0470 (decision 3: groups, subtotals, grand totals and a pivot matrix in one statement).
 */

/**
 * The `grouping()` value of the set that keeps `kept` out of `dimensions`.
 *
 * @example
 * groupingMask(["region", "status"], ["region"]); // 1
 * groupingMask(["region", "status"], []); // 3
 */
export function groupingMask(dimensions: readonly string[], kept: readonly string[]): number {
  return dimensions.reduce(
    (mask, name, index) =>
      kept.includes(name) ? mask : mask | (1 << (dimensions.length - 1 - index)),
    0,
  );
}
