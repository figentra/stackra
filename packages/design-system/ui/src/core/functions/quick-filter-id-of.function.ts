/**
 * Stackra file contract:
 * Purpose: `quickFilterIdOf`, the id of the top-level condition a quick filter (a FilterBar chip, a FilterPanel facet)
 *          keeps for a column, so the bar, the panel and a DataView on one engine edit the same condition.
 * Boundary: pure; conditions the advanced editor adds have other ids and are shown, not edited, as chips.
 * Runtime: isomorphic
 * Governing contract: ADR 0505 (one filter model).
 */
/** The quick filter condition id of a column. */
export function quickFilterIdOf(columnId: string): string {
  return `filter:${columnId}`;
}
