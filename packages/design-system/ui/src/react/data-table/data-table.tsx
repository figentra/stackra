/**
 * Stackra file contract:
 * Purpose: the web `DataTable`: the `Table` with the rest of a resource index around it, on the `useCollection` engine.
 *          The columns are drawn as the engine arranges them (order, names, widths, pins, wrap, hidden), the sort, the
 *          selection ("select all N across pages" from `totalCount`), the density, the group heading rows and the
 *          footer totals are the engine's. With `hasColumnTools` each header gets a `ColumnMenu`, a resize handle and
 *          drag to reorder. It lists a row's `rowActions` in an `ActionMenu` in a last column, draws the `filterBar`
 *          slot above the rows and a `BulkActionBar` while rows are selected, shows an `EmptyState` with the
 *          `no-results` reason when the query narrows the records and the `no-data` reason otherwise, a `PageSkeleton`
 *          for a first load, an `ErrorState` for a failed one and `CursorPagination` under the rows (or the engine's
 *          pages), and passes every other `div` prop to its root.
 * Boundary: given a `collection` (DataView's), every change goes to it. Without one the table runs its own engine in
 *           server mode over the rows it is given, so it never sorts or filters them: `query.sort`, `selectedKeys`,
 *           `isAllMatchingSelected`, `groupBy`, `aggregates` and `density` stay controlled when given, and a header press
 *           calls `onQueryChange` with the next query, as before. `hiddenColumns` hides columns over the engine's own
 *           (the row header is always drawn). Group heading and total rows are drawn in the rows, kept out of the
 *           selection and given no row actions; the total row sticks to the bottom of a sticky-header table. When the
 *           selection empties while the bar had focus the browser drops focus on the page, so focus moves to the table's
 *           container instead (WCAG 2.4.3). A row action is pending while its promise is, shown as a disabled item that
 *           says so, and refuses a second run. It never imports `FilterBar`, which is built beside it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (group-by, aggregates, hidden columns);
 *          data-collection plan (owner, 2026-10-29); ADR 0165 (UI contract); ADR 0303 (decision 7); ADR 0313; ADR 0318
 *          (decisions 2 and 4 to 6); ADR 0139 (action UX); WCAG 2.2 SC 1.3.1, 2.4.3, 4.1.2, 4.1.3; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { useEffect, useRef, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useCollection } from "#react/hooks/use-collection";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDataTableLayout } from "#react/data-table/use-data-table-layout";
import { ActionMenu } from "#react/action-menu/action-menu";
import { BulkActionBar } from "#react/bulk-action-bar/bulk-action-bar";
import { usePendingActions } from "#react/bulk-action-bar/use-pending-actions";
import { Button } from "#react/button/button";
import { CursorPagination } from "#react/cursor-pagination/cursor-pagination";
import { COLLECTION_ICONS } from "#react/data-table/collection-icons.constant";
import { ColumnMenu } from "#react/data-table/column-menu";
import { EmptyState } from "#react/empty-state/empty-state";
import { ErrorState } from "#react/error-state/error-state";
import { PageSkeleton } from "#react/page-skeleton/page-skeleton";
import { Table } from "#react/table/table";
import type { DataTableProps } from "#react/data-table/data-table.props";

/** The id of the row menus' column: the app's columns never use it. */
const ACTIONS_COLUMN_ID = "data-table-row-actions";

/** The classes of the total row: it sticks to the bottom of the scroll area, on the header's ground. */
const TOTAL_ROW_CLASS =
  "sticky bottom-0 z-[3] font-medium [&_td]:bg-surface-secondary [&_td]:border-t [&_td]:border-separator";

/**
 * A resource index on the contract of the web `Table`: the rows, the query that fetched them, the actions on a row and
 * on a selection, and the states around them, drawn from a `useCollection` engine (the app's, or its own).
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
  retryLabel: retryLabelProp,
  headingLevel = 3,
  paginationLabel: paginationLabelProp,
  bulkActionsLabel: bulkActionsLabelProp,
  totalCount,
  isAllMatchingSelected,
  onAllMatchingSelectedChange,
  groupBy,
  aggregates,
  hiddenColumns,
  density,
  isColumnResizable,
  onColumnResize,
  onColumnMove,
  collection: given,
  collectionKey,
  hasColumnTools = false,
  onFilterColumn,
  className,
  ...rest
}: DataTableProps<TItem>): ReactElement {
  const t = useUiText();
  const { locale } = useLocale();

  // The table's own engine, in server mode: the app's query and props stay in control of what they name.
  const controlled: Partial<CollectionState> = {
    sort: query.sort ? [query.sort] : [],
    isAllMatchingSelected: isAllMatchingSelected ?? false,
    ...(selectedKeys ? { selection: selectedKeys } : {}),
    ...(groupBy === undefined ? {} : { groupBy }),
    ...(aggregates === undefined ? {} : { aggregates }),
    ...(density === undefined ? {} : { density }),
  };
  const own = useCollection<TItem>({
    columns,
    items,
    mode: "server",
    locale,
    collectionKey,
    initialState: { selection: defaultSelectedKeys ?? [] },
    state: controlled,
    onStateChange: (next) => {
      const before = own.state;
      if (next.sort[0] !== before.sort[0])
        onQueryChange({ ...query, sort: next.sort[0] ?? null });
      if (next.selection !== before.selection) onSelectionChange?.(next.selection);
      if (next.isAllMatchingSelected !== before.isAllMatchingSelected)
        onAllMatchingSelectedChange?.(next.isAllMatchingSelected);
    },
  });
  const collection = given ?? own;
  const { state } = collection;

  // The columns drawn: the engine's, with the app's `hiddenColumns` over them when given.
  const shownColumns = collection.columns.filter((column) =>
    hiddenColumns ? !column.canHide || !hiddenColumns.includes(column.id) : !column.isHidden,
  );
  const layout = useDataTableLayout({
    items,
    columns: shownColumns,
    groupBy: state.groupBy ?? undefined,
    aggregates: state.aggregates,
    locale,
  });
  const retryLabel = retryLabelProp ?? t(UI_KEYS.ui.data_table.retry);
  const paginationLabel = paginationLabelProp ?? t(UI_KEYS.ui.data_table.pagination, { label });
  const bulkActionsLabel = bulkActionsLabelProp ?? t(UI_KEYS.ui.data_table.bulk_actions, { label });
  const actionsColumn: TableColumn = {
    id: ACTIONS_COLUMN_ID,
    label: t(UI_KEYS.ui.data_table.actions_column),
    align: "end",
  };
  const container = useRef<HTMLDivElement>(null);
  const { pending, run } = usePendingActions();
  const selected = state.selection;
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
  const isFiltered = given ? given.isFiltered : isResourceQueryFiltered(query);
  const hasRows = items.length > 0;
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id ?? "";

  const changeSelection = (picked: readonly string[]) =>
    collection.setSelection(picked.filter((key) => !layout.isSummary(key)));

  const menuItemsOf = (item: TItem): readonly MenuLeafItem[] =>
    (rowActions?.(item) ?? []).map((action) => {
      const key = `${item.id}:${action.id}`;
      const isPending = pending.includes(key);
      return {
        ...action,
        // A pending action is refused like a disabled one, and says why where a description would go.
        ...(isPending
          ? { isDisabled: true, disabledReason: t(UI_KEYS.ui.data_table.working) }
          : {}),
        onPress: () => run(key, action.onPress),
      };
    });

  const cellOf = (item: TItem, column: TableColumn) => {
    if (layout.isSummary(item.id)) {
      // A sum, average, lowest or highest reads as the column's own cells do (riyals stay riyals); a count stays a count.
      const value = layout.summaryValue(item.id, column);
      const kind = state.aggregates[column.id];
      const shown =
        renderCell && value !== null && kind !== "count"
          ? renderCell({ id: item.id, [column.id]: value } as unknown as TItem, column)
          : layout.summaryCell(item.id, column);
      // Anything but a sum names itself, so an average under "Total" never reads as one.
      const named = layout.summaryLabel(column);
      if (named && value !== null)
        return (
          <span className="whitespace-nowrap">
            <span className="me-1.5 text-xs font-normal text-muted">{named}</span>
            {shown}
          </span>
        );
      if (renderCell && value !== null && kind !== "count") return shown;
      // The group's name and count run on into the empty cells beside them rather than wrap in a narrow column.
      return column.id === rowHeaderId ? (
        <span className="whitespace-nowrap font-medium">{layout.summaryCell(item.id, column)}</span>
      ) : (
        layout.summaryCell(item.id, column)
      );
    }
    if (column.id === ACTIONS_COLUMN_ID) {
      const menuItems = menuItemsOf(item);
      if (menuItems.length === 0) return null;
      const name = cellTextOf(item, rowHeaderId) || item.id;
      // The cell is a focus target of its own (grid navigation), so it keeps a 24px strip beside the button (SC 2.5.8).
      return (
        <div className="flex justify-end ps-6">
          <ActionMenu
            label={t(UI_KEYS.ui.data_table.row_actions, { name })}
            sections={[
              {
                id: "row-actions",
                title: t(UI_KEYS.ui.data_table.actions_column),
                isTitleHidden: true,
                items: menuItems,
              },
            ]}
          />
        </div>
      );
    }
    return renderCell ? renderCell(item, column) : cellTextOf(item, column.id);
  };

  const clearFilters = () =>
    given
      ? given.update({ search: "", filter: { match: "all", conditions: [] }, page: 0 })
      : onQueryChange(clearResourceQueryFilters(query));
  const empty = isFiltered
    ? (filteredEmptyState ?? (
        <EmptyState
          reason="no-results"
          headingLevel={headingLevel}
          title={t(UI_KEYS.ui.data_table.no_results_title)}
          description={t(UI_KEYS.ui.data_table.no_results_description)}
          actions={
            <Button variant="secondary" onPress={clearFilters}>
              {t(UI_KEYS.ui.data_table.clear_filters)}
            </Button>
          }
        />
      ))
    : (emptyState ?? (
        <EmptyState
          reason="no-data"
          headingLevel={headingLevel}
          title={t(UI_KEYS.ui.data_table.no_data_title)}
          description={t(UI_KEYS.ui.data_table.no_data_description)}
        />
      ));

  // The engine's pages when it pages (DataView), the app's cursor buttons otherwise.
  const isEnginePaged = given !== undefined && given.paging === "page";
  const hasPager = isEnginePaged || onNext !== undefined || onPrevious !== undefined;
  const isEngineInfinite = given !== undefined && given.paging === "infinite";
  const total = totalCount ?? (given ? given.totalCount : undefined);
  const isResizable = isColumnResizable ?? hasColumnTools;

  return (
    <IconRegistryProvider registry={COLLECTION_ICONS}>
      <div
        {...rest}
        ref={container}
        // Focus lands here when the bulk bar unmounts under a press; it is never reached by Tab.
        tabIndex={-1}
        className={cn("grid min-w-0 gap-3 outline-none", className) ?? ""}
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
            isAllMatchingSelected={state.isAllMatchingSelected}
            onClearSelection={() => changeSelection([])}
            {...(total === undefined ? {} : { totalCount: total })}
            {...(onAllMatchingSelectedChange || given
              ? { onAllMatchingSelectedChange: collection.setAllMatchingSelected }
              : {})}
          />
        ) : null}
        {hasError ? (
          <ErrorState
            title={t(UI_KEYS.ui.data_table.error_title)}
            headingLevel={headingLevel}
            kind={errorKind}
            error={error}
            isMessageShown={isMessageShown}
            retry={onRetry ? { label: retryLabel, onPress: onRetry } : undefined}
          />
        ) : isLoading && !hasRows ? (
          <PageSkeleton
            layout="table"
            loadingLabel={loadingLabel ?? t(UI_KEYS.ui.data_table.loading)}
          />
        ) : (
          <Table
            label={label}
            items={layout.items}
            columns={rowActions ? [...layout.columns, actionsColumn] : layout.columns}
            renderCell={cellOf}
            variant={variant}
            isStickyHeader={isStickyHeader}
            maxHeight={maxHeight}
            selectionMode={selectionMode}
            selectedKeys={selected}
            onSelectionChange={changeSelection}
            sort={state.sort}
            onSortChange={(sort) => collection.setSort([sort])}
            density={state.density}
            emptyState={empty}
            isLoading={isLoading}
            loadingLabel={loadingLabel}
            rowClassName={(item) => (layout.isTotal(item.id) ? TOTAL_ROW_CLASS : undefined)}
            {...(isEngineInfinite ? { hasMore: given.hasMore, onLoadMore: given.loadMore } : {})}
            {...(isResizable
              ? {
                  isColumnResizable: true,
                  onColumnResize: (id: string, width: number) => {
                    if (id === ACTIONS_COLUMN_ID) return;
                    collection.updateColumn(id, { width });
                    onColumnResize?.(id, width);
                  },
                }
              : {})}
            {...(hasColumnTools || onColumnMove
              ? {
                  onColumnMove: (id: string, toIndex: number) => {
                    if (id === ACTIONS_COLUMN_ID) return;
                    collection.moveColumn(id, toIndex);
                    onColumnMove?.(id, toIndex);
                  },
                }
              : {})}
            {...(hasColumnTools
              ? {
                  renderColumnMenu: (column: TableColumn, tools: { readonly startResize: () => void }) => {
                    const resolved = collection.columns.find((entry) => entry.id === column.id);
                    return resolved ? (
                      <ColumnMenu
                        column={resolved}
                        collection={collection}
                        onFilterColumn={onFilterColumn}
                        {...(isResizable && resolved.isResizable !== false
                          ? { onStartResize: tools.startResize }
                          : {})}
                      />
                    ) : null;
                  },
                }
              : {})}
          />
        )}
        {hasPager && !hasError ? (
          isEnginePaged ? (
            <CursorPagination
              label={paginationLabel}
              hasMore={given.hasMore}
              hasPrevious={state.page > 0}
              onNext={() => given.setPage(state.page + 1)}
              onPrevious={() => given.setPage(state.page - 1)}
              count={items.length}
              isLoading={isLoading && hasRows}
            />
          ) : (
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
          )
        ) : null}
        {/* The column menu's moves are said here, politely. */}
        {hasColumnTools ? (
          <div data-collection-announcer="" aria-live="polite" className="sr-only" />
        ) : null}
      </div>
    </IconRegistryProvider>
  );
}
