/**
 * Stackra file contract:
 * Purpose: the whole question a resource index asks the server, as one plain object: the search text, the applied
 *          filters and the sort. It is the one controlled state a router binding mirrors to the URL and the app turns
 *          into a request, so FilterBar edits two of its parts, DataTable the third, and neither holds state of its own.
 * Boundary: types only. The page is not in it: a cursor is the server's and the app keeps the history of cursors (the
 *           pages of ADR 0313 are cursor pages), so changing the query always means going back to the first page.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 1: router-free, the binding is `@stackra/navigation`);
 *          ADR 0318.
 */
import type { FilterState } from "#contracts/types/filter-value.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

/** The search, filters and sort of a resource index. */
export interface ResourceQuery {
  /** The text typed in the search box; an empty string means no search. */
  readonly search: string;
  /** The applied filters, by filter `id`. */
  readonly filterValues: FilterState;
  /** The sort in force, or `null` for the server's own order. */
  readonly sort: SortDescriptor | null;
}
