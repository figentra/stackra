/**
 * Stackra file contract:
 * Purpose: `CollectionPager`, the one pager of the data family: `CursorPagination` over a `useCollection` engine's
 *          `page` or `cursor` paging (Next is the next page or `loadMore`, Previous goes back a page and its cursor);
 *          numbered pages say "Page 2 of 5".
 * Boundary: internal; draws nothing for `none` or `infinite` paging (infinite loads at the end of the view), or when
 *           there is only one page. DataView draws it for every layout; DataTable and DataGrid only when standalone.
 * Runtime: browser
 * Governing contract: ADR 0505 (one pager); ADR 0313 (decisions 3 and 4).
 */
import type { ReactElement } from "react";

import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { CursorPagination } from "#react/cursor-pagination/cursor-pagination";
import { useUiText } from "#react/hooks/use-ui-text";

/** The pager of an engine's pages. */
export function CollectionPager<TItem extends CollectionItem = CollectionItem>({
  collection,
  label,
  paginationLabel,
}: {
  /** The engine whose pages are walked. */
  readonly collection: CollectionController<TItem>;
  /** The name of the records, for the landmark's name. */
  readonly label: string;
  /** The landmark's name; defaults to the label and the word "pagination". */
  readonly paginationLabel?: string | undefined;
}): ReactElement | null {
  const t = useUiText();
  const { paging, state, hasMore } = collection;
  const hasPrevious = state.page > 0;
  if ((paging !== "page" && paging !== "cursor") || (!hasMore && !hasPrevious)) return null;
  return (
    <CursorPagination
      label={paginationLabel ?? t(UI_KEYS.ui.data_table.pagination, { label })}
      hasMore={hasMore}
      hasPrevious={hasPrevious}
      onNext={() =>
        paging === "page" ? collection.setPage(state.page + 1) : collection.loadMore()
      }
      onPrevious={() => collection.setPage(state.page - 1)}
      count={collection.rows.length}
      // Numbered pages say where the reader is; a cursor knows no total, so it counts the rows shown.
      {...(paging === "page"
        ? {
            countLabel: () =>
              t(COLLECTION_KEYS.ui.collection.page_of, {
                page: state.page + 1,
                count: collection.pageCount,
              }),
          }
        : {})}
      isLoading={collection.isLoading && collection.rows.length > 0}
    />
  );
}
