/**
 * Stackra file contract:
 * Purpose: `filterConditionCountOf()`, how many conditions a rule tree holds, nested groups included, for the filter button's badge and "is it filtered".
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionFilter } from "#contracts/types/collection-filter.type";

/**
 * The conditions in the tree.
 * @param filter - the root group
 */
export function filterConditionCountOf(filter: CollectionFilter): number {
  return (
    filter.conditions.length +
    (filter.groups ?? []).reduce((count, group) => count + filterConditionCountOf(group), 0)
  );
}
