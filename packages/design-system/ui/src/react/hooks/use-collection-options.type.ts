/**
 * Stackra file contract:
 * Purpose: `UseCollectionOptions`, what `useCollection` takes: the columns, the rows (every row in client mode, the page
 *          in server mode), the mode and paging, the starting and the controlled state, the persistence key and store,
 *          the saved views, a server fetcher and the locale text is sorted in.
 * Boundary: types only. A slice given in `state` is controlled: the engine reads it from there and reports every change
 *           through `onStateChange`, as React's controlled inputs do.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { CollectionMode } from "#contracts/enums/collection-mode.enum";
import type { CollectionPaging } from "#contracts/enums/collection-paging.enum";
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionPage } from "#contracts/types/collection-page.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import type { CollectionSource } from "#contracts/types/collection-source.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { CollectionStore } from "#contracts/types/collection-store.type";
import type { CollectionView } from "#contracts/types/collection-view.type";

/** The options of `useCollection`. */
export interface UseCollectionOptions<TItem extends CollectionItem = CollectionItem> {
  /** The columns, in their defined order. */
  readonly columns: readonly CollectionColumn[];
  /** Client mode: every row. Server mode without `fetch`: the rows of the page the app fetched for `query`. */
  readonly items?: readonly TItem[] | undefined;
  /** `client` (the default) or `server`. */
  readonly mode?: CollectionMode | undefined;
  /** How the rows are paged. Defaults to `none`. */
  readonly paging?: CollectionPaging | undefined;
  /** The state to start from, over the defaults; a saved state or default view wins over it. */
  readonly initialState?: Partial<CollectionState> | undefined;
  /** The controlled slices of the state. */
  readonly state?: Partial<CollectionState> | undefined;
  /** Called with the whole next state on every change. */
  readonly onStateChange?: ((state: CollectionState) => void) | undefined;
  /** The key the state and views persist under; left out, nothing persists. */
  readonly collectionKey?: string | undefined;
  /** Where they persist. Defaults to the browser's `localStorage` when `collectionKey` is given; `null` for nowhere. */
  readonly store?: CollectionStore | null | undefined;
  /** The saved views to start with, when the store has none. */
  readonly views?: readonly CollectionView[] | undefined;
  /** The view applied on open, when the store has none. */
  readonly defaultViewId?: string | null | undefined;
  /** Server mode: the server adapter whose `fetch` answers each query (`fetch` below wins when both are given). */
  readonly source?: CollectionSource<TItem> | undefined;
  /** Server mode: fetches the page of a query; the engine aborts a fetch a newer query replaces. */
  readonly fetch?:
    | ((query: CollectionQuery, signal: AbortSignal) => Promise<CollectionPage<TItem>>)
    | undefined;
  /** Server mode without `fetch`: how many rows match in all. Defaults to the rows given. */
  readonly totalCount?: number | undefined;
  /** Server mode without `fetch`: true while the app fetches. */
  readonly isLoading?: boolean | undefined;
  /** The locale text is sorted in. Defaults to `en`. */
  readonly locale?: string | undefined;
}
