/**
 * Stackra file contract:
 * Purpose: the query a filter editor asks for: the given query with one filter set to a new value, or with that filter
 *          removed when the value is `undefined` or filters nothing (blank text, no choice, a range with no bound). One
 *          rule for the editors and the chip's remove button on both runtimes, so an emptied filter always loses its
 *          key and so its chip (ADR 0318 decision 3).
 * Boundary: pure; internal, not in the `.` barrel. It returns a new object, never changes the one it is given, keeps the
 *           search and the sort, and keeps the position of a filter that is only edited, so its chip does not jump.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318 (decisions 2 and 3).
 */
import type { FilterValue } from "#contracts/types/filter-value.type";
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { isFilterValueEmpty } from "#core/functions/is-filter-value-empty.function";

/**
 * Gives the query with one filter set or removed.
 * @param query - the search, filters and sort of a resource index
 * @param id - the `id` of the filter to change
 * @param value - the new value; `undefined`, or a value that filters nothing, removes the filter
 * @returns a new query whose `filterValues` holds the filter only when it filters something
 */
export function queryWithFilter(
  query: ResourceQuery,
  id: string,
  value: FilterValue | undefined,
): ResourceQuery {
  if (value === undefined || isFilterValueEmpty(value)) {
    const kept = Object.entries(query.filterValues).filter(([key]) => key !== id);
    return { ...query, filterValues: Object.fromEntries(kept) };
  }
  return { ...query, filterValues: { ...query.filterValues, [id]: value } };
}
