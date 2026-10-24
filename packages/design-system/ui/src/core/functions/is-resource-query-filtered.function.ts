/**
 * Stackra file contract:
 * Purpose: whether a resource query narrows the records: some search text, or at least one filter that is set. DataTable
 *          chooses its "nothing matches" state over its "nothing here yet" state with it, and FilterBar shows its
 *          clear-all button only while it is true. The sort never counts, because it reorders and removes nothing.
 * Boundary: pure; internal, not in the `.` barrel.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318; ADR 0313 (empty and filtered-empty states).
 */
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";
import type { ResourceQuery } from "#contracts/types/resource-query.type";

/**
 * Says whether a query narrows the records.
 * @param query - the search, filters and sort of a resource index
 * @returns true when the search text is not blank or any applied filter has a value
 */
export function isResourceQueryFiltered(query: ResourceQuery): boolean {
  if (query.search.trim() !== "") return true;
  return Object.values(query.filterValues).some((value) => !isFilterValueEmpty(value));
}
