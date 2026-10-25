/**
 * Stackra file contract:
 * Purpose: the query a "clear all" press asks for: no search text and no filter, with the sort kept, because the user
 *          chose the order and clearing a filter does not unchoose it. FilterBar's clear-all button and DataTable's
 *          "clear filters" button in its filtered-empty state both call it, so they agree.
 * Boundary: pure; in the `.` barrel. It returns a new object and never changes the one it is given.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0318.
 */
import type { ResourceQuery } from "#contracts/types/resource-query.type";

/**
 * Gives the query with its search and filters removed.
 * @param query - the search, filters and sort of a resource index
 * @returns a query with an empty search, no filters and the same sort
 */
export function clearResourceQueryFilters(query: ResourceQuery): ResourceQuery {
  return { search: "", filterValues: {}, sort: query.sort };
}
