/**
 * Stackra file contract:
 * Purpose: `applyCollection()`, the client-mode pipeline: quick search over the searchable visible columns, the rule tree, the multi-key sort, then the page (`page`), the pages loaded so far (`infinite`) or every row.
 * Boundary: pure; returns the matching rows too, for the footer totals and "select all matching".
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionPaging } from "#contracts/enums/collection-paging.enum";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import { collectionFilterMatches } from "#core/functions/collection-filter-matches.function";
import { collectionSearchMatches } from "#core/functions/collection-search-matches.function";
import { sortCollectionItems } from "#core/functions/sort-collection-items.function";

/** What the pipeline gives back. */
interface AppliedCollection<TItem extends CollectionItem> {
  /** Every row that matches, sorted. */
  readonly matched: readonly TItem[];
  /** The rows to draw. */
  readonly rows: readonly TItem[];
  /** How many pages there are. */
  readonly pageCount: number;
  /** True while rows after the drawn ones exist. */
  readonly hasMore: boolean;
}

/**
 * The rows of a client-mode collection.
 * @param items - every row
 * @param state - the state
 * @param columns - the resolved columns
 * @param paging - how the rows are paged
 * @param locale - the locale text is collated in
 */
export function applyCollection<TItem extends CollectionItem>(
  items: readonly TItem[],
  state: CollectionState,
  columns: readonly ResolvedCollectionColumn[],
  paging: CollectionPaging,
  locale: string,
): AppliedCollection<TItem> {
  const searched = columns
    .filter((column) => !column.isHidden && column.isFilterable !== false)
    .map((column) => column.id);
  const matched = sortCollectionItems(
    items.filter(
      (item) =>
        collectionSearchMatches(item, state.search, searched) &&
        collectionFilterMatches(state.filter, item as unknown as Readonly<Record<string, unknown>>),
    ),
    state.sort,
    locale,
  );
  const size = Math.max(1, state.pageSize);
  const pageCount = Math.max(1, Math.ceil(matched.length / size));
  if (paging === "page") {
    const page = Math.min(state.page, pageCount - 1);
    return {
      matched,
      rows: matched.slice(page * size, (page + 1) * size),
      pageCount,
      hasMore: page < pageCount - 1,
    };
  }
  if (paging === "infinite" || paging === "cursor") {
    const shown = (state.page + 1) * size;
    return { matched, rows: matched.slice(0, shown), pageCount, hasMore: shown < matched.length };
  }
  return { matched, rows: matched, pageCount: 1, hasMore: false };
}
