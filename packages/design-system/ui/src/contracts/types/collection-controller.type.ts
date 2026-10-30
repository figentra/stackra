/**
 * Stackra file contract:
 * Purpose: `CollectionController`, what `useCollection` returns: the state, the columns as drawn, the rows of the page, the groups and totals, the query, the saved views, and every change a view or toolbar can ask for.
 * Boundary: types only. DataTable, DataGrid, List, the column editor and DataView all take one, so switching views keeps the state.
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); STA-1371.
 */
import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { CollectionDensity } from "#contracts/enums/collection-density.enum";
import type { CollectionLayout } from "#contracts/enums/collection-layout.enum";
import type { CollectionMode } from "#contracts/enums/collection-mode.enum";
import type { CollectionPaging } from "#contracts/enums/collection-paging.enum";
import type { CollectionColumnState } from "#contracts/types/collection-column-state.type";
import type { CollectionFilter } from "#contracts/types/collection-filter.type";
import type { CollectionGroup } from "#contracts/types/collection-group.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import type { CollectionSelection } from "#contracts/types/collection-selection.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { CollectionView } from "#contracts/types/collection-view.type";
import type { ResolvedCollectionColumn } from "#contracts/types/resolved-collection-column.type";
import type { SortDescriptor } from "#contracts/types/sort-descriptor.type";

/** A collection's state and the changes it takes. */
export interface CollectionController<TItem extends CollectionItem = CollectionItem> {
  /** The key the state persists under, if any. */
  readonly collectionKey: string | undefined;
  /** `client` (the engine searches, filters, sorts and pages) or `server` (the app does, from `query`). */
  readonly mode: CollectionMode;
  /** How the rows are paged. */
  readonly paging: CollectionPaging;
  /** The whole state. */
  readonly state: CollectionState;
  /** Every column with the user's state applied, in display order: pinned start, the rest, pinned end. */
  readonly columns: readonly ResolvedCollectionColumn[];
  /** The columns not hidden, in display order. */
  readonly visibleColumns: readonly ResolvedCollectionColumn[];
  /** The rows to draw: in client mode searched, filtered, sorted and paged; in server mode as the app gave them. */
  readonly rows: readonly TItem[];
  /** The rows gathered by `state.groupBy`, or `null` when not grouped. */
  readonly groups: readonly CollectionGroup<TItem>[] | null;
  /** How many rows match the query in all. */
  readonly totalCount: number;
  /** How many pages there are (`page` paging); 1 otherwise. */
  readonly pageCount: number;
  /** True while there are rows after the ones drawn. */
  readonly hasMore: boolean;
  /** The footer aggregate of each column in `state.aggregates`, over every matching row. */
  readonly aggregates: Readonly<Record<string, number | null>>;
  /**
   * What a bulk action acts on: the selected ids; with "all matching" chosen, every matching id in client mode, or in
   * server mode a descriptor of the search and filter (never ids the client does not hold).
   */
  readonly selected: CollectionSelection;
  /** True while a server page loads. */
  readonly isLoading: boolean;
  /** What the last server fetch threw, or `undefined`. */
  readonly error: unknown;
  /** The query of the state, for a server. */
  readonly query: CollectionQuery;
  /** True when the search or the filter narrows the rows. */
  readonly isFiltered: boolean;
  /** The saved views, in order. */
  readonly views: readonly CollectionView[];
  /** The view applied when the collection opens, or `null`. */
  readonly defaultViewId: string | null;
  /** Merges a part of the state in. */
  readonly update: (patch: Partial<CollectionState>) => void;
  /** Sets the quick search, back on the first page. */
  readonly setSearch: (search: string) => void;
  /** Sets the rule tree, back on the first page. */
  readonly setFilter: (filter: CollectionFilter) => void;
  /** Sets the sort keys. */
  readonly setSort: (sort: readonly SortDescriptor[]) => void;
  /**
   * Sorts by a column: ascending, then descending, then off. Additive, it adds or turns the column's key and keeps the
   * others (multi-sort); otherwise the column becomes the only key.
   */
  readonly toggleSort: (columnId: string, isAdditive?: boolean) => void;
  /** Groups the rows by a column, or stops grouping with `null`. */
  readonly setGroupBy: (columnId: string | null) => void;
  /** Sets the footer aggregate of a column, or clears it with `null`. */
  readonly setAggregate: (columnId: string, kind: AggregateKind | null) => void;
  /** Moves a column to a display index. */
  readonly moveColumn: (columnId: string, toIndex: number) => void;
  /** Puts the columns in this order. */
  readonly reorderColumns: (columnIds: readonly string[]) => void;
  /** Changes one column: hidden, name, width, pin or wrap. */
  readonly updateColumn: (columnId: string, patch: Omit<CollectionColumnState, "id">) => void;
  /** Puts every column back as defined. */
  readonly resetColumns: () => void;
  /** Sets the density. */
  readonly setDensity: (density: CollectionDensity) => void;
  /** Sets the view the rows are drawn as. */
  readonly setLayout: (layout: CollectionLayout) => void;
  /** Sets the selected row ids; any change drops "all matching". */
  readonly setSelection: (keys: readonly string[]) => void;
  /** Selects every matching row beyond the ones loaded, or goes back to the rows selected; either clears the exclusions. */
  readonly setAllMatchingSelected: (isAll: boolean) => void;
  /** With "all matching" chosen, the rows unticked since: every matching row but these stays selected. */
  readonly setExcludedKeys: (keys: readonly string[]) => void;
  /** Shows a page, from 0. */
  readonly setPage: (page: number) => void;
  /** Sets the rows per page, back on the first page. */
  readonly setPageSize: (pageSize: number) => void;
  /** Loads the next page: appended for `infinite`, the next cursor for `cursor`. */
  readonly loadMore: () => void;
  /** Applies a saved view over the defaults. */
  readonly applyView: (viewId: string) => void;
  /** Saves the current state as a new view and applies it; returns its id. */
  readonly saveViewAs: (label: string) => string;
  /** Saves the current state over an existing view. */
  readonly saveView: (viewId: string) => void;
  /** Renames a view. */
  readonly renameView: (viewId: string, label: string) => void;
  /** Deletes a view. */
  readonly deleteView: (viewId: string) => void;
  /** Makes a view the one applied on open, or none with `null`. */
  readonly setDefaultView: (viewId: string | null) => void;
  /** Puts the whole state back as first given (the saved views stay). */
  readonly reset: () => void;
  /** Fetches the page again (server mode with a fetcher). */
  readonly refresh: () => void;
}
