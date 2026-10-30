/**
 * Stackra file contract:
 * Purpose: `CollectionQuery`, what a server-mode collection asks the app for: the search, the filter tree, the sort keys, the group, the page and the visible columns.
 * Boundary: types only; plain data, so it serialises to a URL or a request body as is.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionPaging } from "#contracts/enums/collection-paging.enum";
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

/** The query of a collection. */
export interface CollectionQuery {
  /** The quick search text. */
  readonly search: string;
  /** The rule tree; an empty root means no filter. */
  readonly filter: CollectionFilter;
  /** The sort keys, most significant first. */
  readonly sort: readonly SortDescriptor[];
  /** The column to group by, or `null`. */
  readonly groupBy: string | null;
  /** How the rows are paged. */
  readonly paging: CollectionPaging;
  /** The page asked for, from 0. */
  readonly page: number;
  /** The rows per page. */
  readonly pageSize: number;
  /** The cursor of the page asked for (`cursor` paging), or `null` for the first. */
  readonly cursor: string | null;
  /** The ids of the visible columns, in order, so the server can leave the others out. */
  readonly columns: readonly string[];
}
