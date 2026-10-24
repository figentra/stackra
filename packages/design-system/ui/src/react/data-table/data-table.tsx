/**
 * Stackra file contract:
 * Purpose: the web `DataTable`: the wave 5 `Table` with the rest of a resource index around it, drawn from the shared
 *          contract. It reads the sort from `query.sort` and writes the next sort to `onQueryChange`, lists a row's
 *          `rowActions` in an `ActionMenu` in a last column, draws the `filterBar` slot above the rows and a
 *          `BulkActionBar` while several rows are selected (with "select all N across pages" from `totalCount`), shows
 *          an `EmptyState` with the `no-results` reason when the query narrows the records and the `no-data` reason
 *          otherwise, a `PageSkeleton` for a first load, an `ErrorState` for a failed one and `CursorPagination` under
 *          the rows, and passes every other `div` prop to its root.
 * Boundary: it holds no query and fetches nothing. The selection is the one state it keeps, and only when the app does
 *           not control it, so the bar can count it; choosing a row or clearing the selection while "all matching" is
 *           chosen takes the app back to the rows shown. When the selection empties while the bar had focus (its
 *           clear button, or an action that clears it) the browser drops focus on the page, so focus moves to the table's
 *           container instead (WCAG 2.4.3); a focus that is anywhere else is left alone. A row action is pending while its promise
 *           is, shown as a disabled item that says so, and refuses a second run. The `Table` is composed, not copied: its
 *           sticky header, selection column and loading row are its own. It never imports `FilterBar`, which is built
 *           beside it; the app puts one in the `filterBar` slot with the same `query`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract); ADR 0303 (decision 7); ADR 0313; ADR 0318
 *          (decisions 2 and 4 to 6); ADR 0139 (action UX); WCAG 2.2 SC 1.3.1, 2.4.3, 4.1.2, 4.1.3; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import { cn } from "@heroui/react";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { ActionMenu } from "#react/action-menu/action-menu";
import { BulkActionBar } from "#react/bulk-action-bar/bulk-action-bar";
import { usePendingActions } from "#react/bulk-action-bar/use-pending-actions";
import { Button } from "#react/button/button";
import { CursorPagination } from "#react/cursor-pagination/cursor-pagination";
import { EmptyState } from "#react/empty-state/empty-state";
import { ErrorState } from "#react/error-state/error-state";
import { PageSkeleton } from "#react/page-skeleton/page-skeleton";
import { Table } from "#react/table/table";

/**
 * Props of the web DataTable: the shared contract plus the attributes of its root `div`, passed through. The rows and
 * cells are `items` and `renderCell`, so children are refused.
 */
export type DataTableProps<TItem extends CollectionItem = CollectionItem> =
  DataTableContractProps<TItem> &
    Omit<ComponentPropsWithoutRef<"div">, keyof DataTableContractProps | "children">;

// shortcut: English until @stackra/i18n ships; then the keys `ui::data-table.*`.
const STRINGS = {
  loading: "Loading",
  actionsColumn: "Actions",
  rowActions: (name: string) => `Actions for ${name}`,
  working: "Working",
  noDataTitle: "Nothing here yet",
  noDataDescription: "Records will appear here once they exist.",
  noResultsTitle: "No results",
  noResultsDescription: "No record matches the search and filters. Try changing or clearing them.",
  clearFilters: "Clear filters",
  errorTitle: "The records could not be loaded",
  retry: "Try again",
  pagination: (label: string) => `${label} pagination`,
  bulkActions: (label: string) => `${label} actions`,
} as const;

/** The column of the row menus: the app's columns never use this id. */
const ACTIONS_COLUMN: TableColumn = Object.freeze({
  id: "data-table-row-actions",
  label: STRINGS.actionsColumn,
  align: "end",
});

/**
 * A resource index on the contract of the web `Table`: the rows, the query that fetched them, the actions on a row and
 * on a selection, and the states around them. The query is controlled by the app (or the router binding): a press on a
 * sortable header calls `onQueryChange` with the next query, and the app fetches the rows in that order.
 */
export function DataTable<TItem extends CollectionItem = CollectionItem>({
  label,
  items,
  columns,
  renderCell,
  variant,
  isStickyHeader,
  maxHeight,
  selectionMode = "none",
  selectedKeys,
  defaultSelectedKeys,
  onSelectionChange,
  emptyState,
  isLoading = false,
  loadingLabel,
  hasMore = false,
  hasPrevious,
  onNext,
  onPrevious,
  mode,
  query,
  onQueryChange,
  rowActions,
  bulkActions,
  filterBar,
  filteredEmptyState,
  error,
  errorKind,
  isMessageShown,
  onRetry,
  retryLabel = STRINGS.retry,
  headingLevel = 3,
  paginationLabel = STRINGS.pagination(label),
  bulkActionsLabel = STRINGS.bulkActions(label),
  totalCount,
  isAllMatchingSelected = false,
  onAllMatchingSelectedChange,
  className,
  ...rest
}: DataTableProps<TItem>) {
  const container = useRef<HTMLDivElement>(null);
  const { pending, run } = usePendingActions();
  // The selection is kept here only so the bar can count it; a controlled `selectedKeys` always wins.
  const [own, setOwn] = useState<readonly string[]>(defaultSelectedKeys ?? []);
  const selected = selectedKeys ?? own;
  const previousCount = useRef(selected.length);
  useEffect(() => {
    // The bar unmounts when the selection empties; if it held focus, the browser drops it on the body.
    if (
      previousCount.current > 0 &&
      selected.length === 0 &&
      document.activeElement === document.body
    )
      container.current?.focus({ preventScroll: true });
    previousCount.current = selected.length;
  }, [selected.length]);
  const hasError = error !== undefined && error !== null;
  const isFiltered = isResourceQueryFiltered(query);
  const hasRows = items.length > 0;
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id ?? "";

  const changeSelection = (keys: readonly string[]) => {
    setOwn(keys);
    onSelectionChange?.(keys);
    // The keys are the rows on screen once "all matching" is chosen, so any change goes back to them.
    if (isAllMatchingSelected) onAllMatchingSelectedChange?.(false);
  };

  const menuItemsOf = (item: TItem): readonly MenuLeafItem[] =>
    (rowActions?.(item) ?? []).map((action) => {
      const key = `${item.id}:${action.id}`;
      const isPending = pending.includes(key);
      return {
        ...action,
        // A pending action is refused like a disabled one, and says why where a description would go.
        ...(isPending ? { isDisabled: true, disabledReason: STRINGS.working } : {}),
        onPress: () => run(key, action.onPress),
      };
    });

  const cellOf = (item: TItem, column: TableColumn) => {
    if (column.id === ACTIONS_COLUMN.id) {
      const menuItems = menuItemsOf(item);
      if (menuItems.length === 0) return null;
      const name = cellTextOf(item, rowHeaderId) || item.id;
      return (
        <ActionMenu
          label={STRINGS.rowActions(name)}
          sections={[
            {
              id: "row-actions",
              title: STRINGS.actionsColumn,
              isTitleHidden: true,
              items: menuItems,
            },
          ]}
        />
      );
    }
    return renderCell ? renderCell(item, column) : cellTextOf(item, column.id);
  };

  const empty = isFiltered
    ? (filteredEmptyState ?? (
        <EmptyState
          reason="no-results"
          headingLevel={headingLevel}
          title={STRINGS.noResultsTitle}
          description={STRINGS.noResultsDescription}
          actions={
            <Button
              variant="secondary"
              onPress={() => onQueryChange(clearResourceQueryFilters(query))}
            >
              {STRINGS.clearFilters}
            </Button>
          }
        />
      ))
    : (emptyState ?? (
        <EmptyState
          reason="no-data"
          headingLevel={headingLevel}
          title={STRINGS.noDataTitle}
          description={STRINGS.noDataDescription}
        />
      ));

  const hasPager = onNext !== undefined || onPrevious !== undefined;

  return (
    <div
      {...rest}
      ref={container}
      // Focus lands here when the bulk bar unmounts under a press; it is never reached by Tab.
      tabIndex={-1}
      className={cn("grid gap-3 outline-none", className) ?? ""}
    >
      {filterBar}
      {selectionMode === "multiple" ? (
        <BulkActionBar
          // `contents` keeps the always-present wrapper out of the grid, so an idle bar adds no gap.
          className="contents"
          label={bulkActionsLabel}
          selectedCount={selected.length}
          actions={bulkActions ?? []}
          isPageSelected={hasRows && items.every((item) => selected.includes(item.id))}
          isAllMatchingSelected={isAllMatchingSelected}
          onClearSelection={() => changeSelection([])}
          {...(totalCount === undefined ? {} : { totalCount })}
          {...(onAllMatchingSelectedChange ? { onAllMatchingSelectedChange } : {})}
        />
      ) : null}
      {hasError ? (
        <ErrorState
          title={STRINGS.errorTitle}
          headingLevel={headingLevel}
          kind={errorKind}
          error={error}
          isMessageShown={isMessageShown}
          retry={onRetry ? { label: retryLabel, onPress: onRetry } : undefined}
        />
      ) : isLoading && !hasRows ? (
        <PageSkeleton layout="table" loadingLabel={loadingLabel ?? STRINGS.loading} />
      ) : (
        <Table
          label={label}
          items={items}
          columns={rowActions ? [...columns, ACTIONS_COLUMN] : columns}
          renderCell={cellOf}
          variant={variant}
          isStickyHeader={isStickyHeader}
          maxHeight={maxHeight}
          selectionMode={selectionMode}
          selectedKeys={selected}
          onSelectionChange={changeSelection}
          sortDescriptor={query.sort ?? undefined}
          onSortChange={(sort) => onQueryChange({ ...query, sort })}
          emptyState={empty}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
        />
      )}
      {hasPager && !hasError ? (
        <CursorPagination
          label={paginationLabel}
          hasMore={hasMore}
          hasPrevious={hasPrevious}
          onNext={onNext}
          onPrevious={onPrevious}
          mode={mode}
          count={items.length}
          isLoading={isLoading && hasRows}
        />
      ) : null}
    </div>
  );
}
