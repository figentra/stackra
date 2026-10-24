/**
 * Stackra file contract:
 * Purpose: the native `DataTable`, the adapted form of ADR 0302 (decision 3) and ADR 0318 (decision 10): the native
 *          `Table` (a list of cards, itself the adapted form) with the rest of a resource index around it, on the web
 *          one's contract. It reads the sort from `query.sort` and writes the next sort to `onQueryChange` (the table's
 *          sort chooser asks), lists a row's `rowActions` in an `ActionMenu` on a last line of the card, draws the
 *          `filterBar` slot above the list, a `BulkActionBar` as the bottom bar while several rows are selected, an
 *          `EmptyState` (`no-results` when the query narrows, `no-data` otherwise), a `PageSkeleton` for a first load,
 *          an `ErrorState` for a failed one and `CursorPagination` under the list, and passes every other `View` prop to
 *          its root.
 * Boundary: it holds no query and fetches nothing. The selection is the one state it keeps, and only when the app does
 *           not control it, so the bar can count it; choosing a row or clearing the selection while "all matching" is
 *           chosen takes the app back to the rows shown. A row action is pending while its promise is, shown as a
 *           disabled item that says so, and refuses a second tap. The row menu is HeroUI Native's popover, never a bottom
 *           sheet, because every native sheet is the inset one and the bar's overflow already is. Known limit: a selectable
 *           row of the native `Table` is one accessible element that reads out its cells, so a screen reader reaches a row's
 *           menu only on a table with no selection; with a selection, the bulk bar offers the same actions on the chosen
 *           rows. Native has no focus to move after the clear button, which the bar's removal leaves to the platform. It
 *           never imports `FilterBar`, which is built beside it; the app puts one in the `filterBar` slot with the same
 *           `query`. Strings are always wrapped in `Text`, which React Native requires.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0313; ADR 0318
 *          (decisions 2, 4 to 6 and 10); ADR 0139 (action UX); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2;
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import { useState } from "react";
import { View, type ViewProps } from "react-native";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataTableContractProps } from "#contracts/types/data-table-contract-props.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { ActionMenu } from "#native/action-menu/action-menu";
import { BulkActionBar } from "#native/bulk-action-bar/bulk-action-bar";
import { usePendingActions } from "#native/bulk-action-bar/use-pending-actions";
import { Button } from "#native/button/button";
import { CursorPagination } from "#native/cursor-pagination/cursor-pagination";
import { EmptyState } from "#native/empty-state/empty-state";
import { ErrorState } from "#native/error-state/error-state";
import { PageSkeleton } from "#native/page-skeleton/page-skeleton";
import { Table } from "#native/table/table";
import { Text } from "#native/text/text";

/**
 * Props of the native DataTable: the shared contract plus the props of a `View`, passed through. The rows and cells are
 * `items` and `renderCell`, so children are refused.
 */
export type DataTableProps<TItem extends CollectionItem = CollectionItem> =
  DataTableContractProps<TItem> & Omit<ViewProps, keyof DataTableContractProps | "children">;

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
 * A resource index on the contract of the native `Table`: the rows, the query that fetched them, the actions on a row
 * and on a selection, and the states around them. The query is controlled by the app (or the router binding): the
 * table's sort chooser calls `onQueryChange` with the next query, and the app fetches the rows in that order.
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
  const { pending, run } = usePendingActions();
  // The selection is kept here only so the bar can count it; a controlled `selectedKeys` always wins.
  const [own, setOwn] = useState<readonly string[]>(defaultSelectedKeys ?? []);
  const selected = selectedKeys ?? own;
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
    <View {...rest} className={`flex-1 gap-3 ${className ?? ""}`}>
      {typeof filterBar === "string" || typeof filterBar === "number" ? (
        <Text>{filterBar}</Text>
      ) : (
        filterBar
      )}
      {hasError ? (
        <ErrorState
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
      {selectionMode === "multiple" ? (
        <BulkActionBar
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
    </View>
  );
}
