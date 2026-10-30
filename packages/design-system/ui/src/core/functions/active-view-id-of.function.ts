/**
 * Stackra file contract:
 * Purpose: `activeViewIdOf()`, the id of the saved view whose query equals the current one, so `SavedViews` marks it
 *          chosen; a query changed by hand matches none.
 * Boundary: a pure function; queries are compared as JSON (filter keys in any order).
 * Runtime: isomorphic
 * Governing contract: ADR 0318; product audit 2026-10-28 (saved views).
 */
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import type { SavedView } from "#contracts/types/saved-view.type";

/** The query as comparable text, filters sorted by key and empty ones dropped. */
function keyOf(query: ResourceQuery): string {
  const filters = Object.entries(query.filterValues)
    .filter(
      ([, value]) =>
        value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0),
    )
    // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify([query.search, filters, query.sort]);
}

/**
 * The chosen view's id.
 * @param views - the saved views
 * @param query - the current query
 * @returns the id of the first view whose query matches, or undefined
 */
export function activeViewIdOf(
  views: readonly SavedView[],
  query: ResourceQuery,
): string | undefined {
  const current = keyOf(query);
  return views.find((view) => keyOf(view.query) === current)?.id;
}
