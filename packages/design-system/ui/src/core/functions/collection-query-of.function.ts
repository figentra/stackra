/**
 * Stackra file contract:
 * Purpose: `collectionQueryOf()`, the query object a server-mode collection hands the app for its state.
 * Boundary: pure; plain data.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionPaging } from "#contracts/enums/collection-paging.enum";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";

/**
 * The query of the state.
 * @param state - the state
 * @param columns - the resolved columns
 * @param paging - how the rows are paged
 */
export function collectionQueryOf(
  state: CollectionState,
  columns: readonly ResolvedCollectionColumn[],
  paging: CollectionPaging,
): CollectionQuery {
  return {
    search: state.search,
    filter: state.filter,
    sort: state.sort,
    groupBy: state.groupBy,
    paging,
    page: state.page,
    pageSize: state.pageSize,
    cursor: state.cursor,
    columns: columns.filter((column) => !column.isHidden).map((column) => column.id),
  };
}
