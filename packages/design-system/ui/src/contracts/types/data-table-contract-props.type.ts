/**
 * Stackra file contract:
 * Purpose: the props every runtime's `DataTable` takes: the `Table` props over rows, columns and selection, the
 *          controlled resource query (the table reads the sort from it and writes the next sort to it), the actions of
 *          a row and of a selection, "select all N across pages", the `filterBar` slot, the cursor paging buttons and
 *          the error state. Each runtime's `DataTableProps` is this plus its own base props.
 * Boundary: types only. The table holds no query and fetches nothing: a press on a header calls `onQueryChange` with the
 *           whole next query, and `onNext` and `onPrevious` ask for a cursor page, which the app fetches. It drops the
 *           `Table`'s own `sortDescriptor`, `onSortChange` and `onLoadMore` because the query and the pager replace
 *           them. The `filterBar` slot takes any node, so the table never imports `FilterBar`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313 (decisions 3 and 4); ADR 0318
 *          (decisions 2 and 4 to 6); product audit 2026-10-28 (group-by, aggregates, column chooser); data-collection plan (owner, 2026-10-29).
 */
import type { ReactNode } from "react";

import type { AggregateKind } from "#contracts/enums/aggregate-kind.enum";
import type { ErrorStateKind } from "#contracts/enums/error-state-kind.enum";
import type { HeadingLevel } from "#contracts/enums/heading-level.enum";
import type { AllMatchingSelectionContractProps } from "#contracts/types/all-matching-selection-contract-props.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";
import type { ResourceAction } from "#contracts/types/resource-action.type";
import type { ResourceQueryContractProps } from "#contracts/types/resource-query-contract-props.type";
import type { TableContractProps } from "#contracts/types/table-contract-props.type";

/** Props shared by the web and native `DataTable`. */
export interface DataTableContractProps<TItem extends CollectionItem = CollectionItem>
  extends
    Omit<
      TableContractProps<TItem>,
      "sortDescriptor" | "onSortChange" | "onLoadMore" | "sort" | "renderColumnMenu"
    >,
    ResourceQueryContractProps,
    AllMatchingSelectionContractProps,
    Pick<CursorPaginationContractProps, "hasPrevious" | "onNext" | "onPrevious" | "mode"> {
  /**
   * The actions of one row, listed in the row's menu in a last column. The handler of each closes over the row.
   * Left out, there is no actions column.
   */
  readonly rowActions?: ((item: TItem) => readonly ResourceAction[]) | undefined;
  /** The actions on the selection, drawn by the bulk bar while rows are selected (`selectionMode` `multiple`). */
  readonly bulkActions?: readonly ResourceAction[] | undefined;
  /** What is drawn above the rows, usually a `FilterBar` given the same `query`; the table does not import it. */
  readonly filterBar?: ReactNode;
  /**
   * What the table shows in place of its own "no results" state when the query narrows the records and none match.
   * Left out, an `EmptyState` with the `no-results` reason and a button that clears the filters.
   */
  readonly filteredEmptyState?: ReactNode;
  /** The thrown value of a failed fetch. Given, the table shows an `ErrorState` in place of the rows. */
  readonly error?: unknown;
  /** What kind of failure `error` is, so the state's wording and icon fit. Defaults to `unexpected`. */
  readonly errorKind?: ErrorStateKind | undefined;
  /**
   * Whether the error's message is shown, as for `ErrorState`: by default outside production only, because a server
   * message is an internal. An app whose error carries text written for the user sets it to true.
   */
  readonly isMessageShown?: boolean | undefined;
  /** Called by the error state's retry button; left out, the error state has no button. */
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
   * The id of a column to group the rows by: the rows on screen are gathered under a heading row per value of that
   * column (in the order the values first appear), which carries the group's count and aggregates.
   */
  readonly groupBy?: string | undefined;
  /** The aggregate of each numeric column, by column id: a heading row per group and a total row at the end show it. */
  readonly aggregates?: Readonly<Record<string, AggregateKind>> | undefined;
  /** The ids of the columns not drawn, usually from a `ColumnChooser`; the row-header column is always drawn. */
  readonly hiddenColumns?: readonly string[] | undefined;
  /**
   * The collection engine to draw from (`useCollection`), as DataView passes it: the columns as arranged, the sort
   * keys, the selection, the density, the group and the totals are its, and every change goes back to it. Left out,
   * the table runs its own engine over `columns`, controlled by `query`, `selectedKeys`, `groupBy`, `aggregates` and
   * `hiddenColumns` as before.
   */
  readonly collection?: CollectionController<TItem> | undefined;
  /** The key the table's own engine keeps the user's column layout under (left out, nothing persists). */
  readonly collectionKey?: string | undefined;
  /**
   * True to give each header the column tools: a menu (sort, add to sort, filter, pin, hide, group, summary, resize,
   * move), a resize handle and drag to reorder.
   */
  readonly hasColumnTools?: boolean | undefined;
  /** Called by a column menu's "Filter by this column"; left out, the menu has no such item. */
  readonly onFilterColumn?: ((columnId: string) => void) | undefined;
}
