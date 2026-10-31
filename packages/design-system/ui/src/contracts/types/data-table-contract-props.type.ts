/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DataTable` takes: the `Table` drawn from a `useCollection` engine (its columns as
 *          arranged, sort, selection, "select all N across pages", density, group and totals, and its pages), the
 *          actions of a row and of a selection, the `filterBar` slot and the loading, empty and error states. Each
 *          runtime's `DataTableProps` is this plus its own base props.
 * Boundary: types only. The table holds no data state: every change goes to the engine. Give `collection`
 *           (`useCollection`, client or server mode), or the shorthand `items` and `columns`, which runs a client-mode
 *           engine of its own so a simple table needs no hook. The pager reads the engine's paging. The `filterBar` slot
 *           takes any node, usually a `FilterBar` given the same engine. It replaced the `ResourceQuery` props
 *           (`query`, `onQueryChange`, `hiddenColumns`, `groupBy`, `aggregates`, `onNext`, `onPrevious`) on 2026-10-31.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 3 and 4); ADR 0505 (one data
 *          family, supersedes the resource query of ADR 0318); data-collection plan (owner, 2026-10-29).
 */
import type { ReactNode } from "react";
import type { ErrorStateKind } from "#contracts/enums/error-state-kind.enum";
import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";

/** Props shared by the web and native `DataTable`. */
export interface DataTableContractProps<TItem extends CollectionItem = CollectionItem> extends Omit<
  TableContractProps<TItem>,
  | "items"
  | "columns"
  | "sort"
  | "onSortChange"
  | "hasMore"
  | "onLoadMore"
  | "selectedKeys"
  | "defaultSelectedKeys"
  | "onSelectionChange"
  | "density"
  | "renderColumnMenu"
> {
  /** The engine to draw from (`useCollection`): its rows, columns, sort, selection, group, totals and pages. */
  readonly collection?: CollectionController<TItem> | undefined;
  /** Shorthand without `collection`: the rows of a client-mode engine the table runs itself. */
  readonly items?: readonly TItem[] | undefined;
  /** Shorthand without `collection`: the columns of the table's own engine. */
  readonly columns?: readonly CollectionColumn[] | undefined;
  /** The key the table's own engine keeps the user's columns, sort and density under (left out, nothing persists). */
  readonly collectionKey?: string | undefined;
  /**
   * The actions of one row, listed in the row's menu in a last column. The handler of each closes over the row.
   * Left out, there is no actions column.
   */
  readonly rowActions?: ((item: TItem) => readonly ResourceAction[]) | undefined;
  /** The actions on the selection, drawn by the bulk bar while rows are selected (`selectionMode` `multiple`). */
  readonly bulkActions?: readonly ResourceAction[] | undefined;
  /** What is drawn above the rows, usually a `FilterBar` given the same engine; the table does not import it. */
  readonly filterBar?: ReactNode;
  /**
   * What the table shows in place of its own "no results" state when the search or filter narrows the records and none
   * match. Left out, an `EmptyState` with the `no-results` reason and a button that clears the filters.
   */
  readonly filteredEmptyState?: ReactNode;
  /** The thrown value of a failed fetch; defaults to the engine's. Given, the table shows an `ErrorState`. */
  readonly error?: unknown;
  /** What kind of failure `error` is, so the state's wording and icon fit. Defaults to `unexpected`. */
  readonly errorKind?: ErrorStateKind | undefined;
  /**
   * Whether the error's message is shown, as for `ErrorState`: by default outside production only, because a server
   * message is an internal. An app whose error carries text written for the user sets it to true.
   */
  readonly isMessageShown?: boolean | undefined;
  /** Called by the error state's retry button; defaults to the engine's refresh in server mode. */
  readonly onRetry?: (() => void) | undefined;
  /** The text of the retry button. Defaults to the `ui` catalogue's word in the active locale. */
  readonly retryLabel?: string | undefined;
  /** The level of the empty and error states' titles, so the page keeps one outline. Defaults to 3. */
  readonly headingLevel?: HeadingLevel | undefined;
  /** The spoken name of the pagination landmark. Defaults to the table's `label` and the word "pagination". */
  readonly paginationLabel?: string | undefined;
  /** The spoken name of the bulk bar. Defaults to the table's `label` and the word "actions". */
  readonly bulkActionsLabel?: string | undefined;
  /**
   * True to give each header the column tools: a menu (sort, add to sort, filter, pin, hide, group, summary, resize,
   * move), a resize handle and drag to reorder.
   */
  readonly hasColumnTools?: boolean | undefined;
  /** Called by a column menu's "Filter by this column"; left out, the menu has no such item. */
  readonly onFilterColumn?: ((columnId: string) => void) | undefined;
}
