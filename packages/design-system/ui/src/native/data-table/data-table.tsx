/**
 * Stackra file contract:
 * Purpose: the native `DataTable`, the adapted form of ADR 0302 (decision 3): the native `Table` (a list of cards,
 *          itself the adapted form) drawn from a `useCollection` engine, on the web one's contract. The rows, the
 *          columns as arranged (hidden ones left out), the sort (the table's sort chooser asks the engine), the
 *          selection with "all matching", the group heading and total rows and the pages are the engine's: the app's
 *          (`collection`) or the table's own client-mode one over the shorthand `items` and `columns`. It lists a row's
 *          `rowActions` in an `ActionMenu` on a last line of the card, draws the `filterBar` slot above the list (with
 *          `hasColumnTools`, a `ColumnEditor` beside it: show, hide, order, pin, rename and density, the column tools a
 *          phone has; a header menu, a resize and "Filter by this column" stay web-only), a
 *          `BulkActionBar` as the bottom bar while several rows are selected, an `EmptyState` (`no-results` when the
 *          search or filter narrows, `no-data` otherwise), a `PageSkeleton` for a first load, an `ErrorState` for a
 *          failed one and `CursorPagination` under the list for `page` and `cursor` paging (`infinite` loads at the
 *          end), and passes every other `View` prop to its root.
 * Boundary: it holds no data state: every change goes to the engine. Group heading and total rows are kept out of the
 *           selection and given no row actions. A row action is pending while its promise is, shown as a disabled item
 *           that says so, and refuses a second tap. The row menu is HeroUI Native's popover, never a bottom sheet,
 *           because every native sheet is the inset one and the bar's overflow already is. Known limit: a selectable
 *           row of the native `Table` is one accessible element that reads out its cells, so a screen reader reaches a
 *           row's menu only on a table with no selection; with a selection, the bulk bar offers the same actions on the
 *           chosen rows. It never imports `FilterBar`; the app puts one given the same engine in the `filterBar` slot.
 *           Strings are always wrapped in `Text`, which React Native requires.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0505 (one data family: the table on the engine, audit D9); ADR 0165
 *          (HeroUI Native on native); ADR 0303 (decision 7); ADR 0313; ADR 0139 (action UX); ADR 0060 (right-to-left);
 *          WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2; owner decision 6 of STA-350 (thin wrappers).
 */
import { useContext, type ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useCollection } from "#react/hooks/use-collection";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDataTableLayout } from "#react/data-table/use-data-table-layout";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { ActionMenu } from "#native/action-menu/action-menu";
import { BulkActionBar } from "#native/bulk-action-bar/bulk-action-bar";
import { usePendingActions } from "#react/hooks/use-pending-actions";
import { Button } from "#native/button/button";
import { ColumnEditor } from "#native/column-chooser/column-editor";
import { CursorPagination } from "#native/cursor-pagination/cursor-pagination";
import { EmptyState } from "#native/empty-state/empty-state";
import { ErrorState } from "#native/error-state/error-state";
import { PageSkeleton } from "#native/page-skeleton/page-skeleton";
import { Table } from "#native/table/table";
import { Text } from "#native/text/text";
import type { DataTableProps } from "#native/data-table/data-table.props";

/** The id of the row menus' column: the app's columns never use it. */
const ACTIONS_COLUMN_ID = "data-table-row-actions";

/**
 * A collection on the contract of the native `Table`: the engine's rows, the actions on a row and on a selection, and
 * the states around them. Give `collection`, or `items` and `columns` for a client-mode engine of the table's own.
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
  emptyState,
  isLoading: isLoadingProp,
  loadingLabel,
  collection: given,
  collectionKey,
  rowActions,
  bulkActions,
  filterBar,
  filteredEmptyState,
  error: errorProp,
  errorKind,
  isMessageShown,
  onRetry: onRetryProp,
  retryLabel: retryLabelProp,
  headingLevel = 3,
  paginationLabel: paginationLabelProp,
  bulkActionsLabel: bulkActionsLabelProp,
  hasColumnTools = false,
  onFilterColumn: _onFilterColumn,
  scrollEnabled,
  className,
  ...rest
}: DataTableProps<TItem>): ReactElement {
  const t = useUiText();
  // Read softly: a table with no aggregates needs no provider, and numbers fall back to English.
  const locale = useContext(DesignSystemContext)?.locale ?? "en";
  // The table's own engine over the shorthand; the app's `collection` wins. The hook always runs (rules of hooks).
  const own = useCollection<TItem>({
    columns: columns ?? [],
    items: items ?? [],
    locale,
    collectionKey,
  });
  const collection = given ?? own;
  const { state } = collection;
  const rows = collection.rows;
  const isLoading = isLoadingProp ?? collection.isLoading;
  const error = errorProp ?? collection.error;
  const onRetry = onRetryProp ?? (collection.mode === "server" ? collection.refresh : undefined);
  const layout = useDataTableLayout({
    items: rows,
    columns: collection.visibleColumns,
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
  const { pending, run } = usePendingActions();
  const selected = state.selection;
  const hasError = error !== undefined && error !== null;
  const hasRows = rows.length > 0;
  const rowHeaderId =
    (collection.columns.find((column) => column.isRowHeader) ?? collection.columns[0])?.id ?? "";

  // Any change of the rows chosen goes back to them from "all matching" (the engine drops it on a new selection).
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
      // Anything but a sum names itself ("Average 6.5"), so it never reads as a total.
      const named = layout.summaryLabel(column);
      const cell = layout.summaryCell(item.id, column);
      return named && layout.summaryValue(item.id, column) !== null
        ? `${named} ${String(cell)}`
        : cell;
    }
    if (column.id === ACTIONS_COLUMN_ID) {
      const menuItems = menuItemsOf(item);
      if (menuItems.length === 0) return null;
      const name = cellTextOf(item, rowHeaderId) || item.id;
      return (
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
      );
    }
    return renderCell ? renderCell(item, column) : cellTextOf(item, column.id);
  };

  const empty = collection.isFiltered
    ? (filteredEmptyState ?? (
        <EmptyState
          reason="no-results"
          headingLevel={headingLevel}
          title={t(UI_KEYS.ui.data_table.no_results_title)}
          description={t(UI_KEYS.ui.data_table.no_results_description)}
          actions={
            <Button
              variant="secondary"
              onPress={() => {
                collection.setSearch("");
                collection.setFilter({ match: "all", conditions: [] });
              }}
            >
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

  const hasPager = collection.paging === "page" || collection.paging === "cursor";

  return (
    <View {...rest} className={`flex-1 gap-3 ${className ?? ""}`}>
      {typeof filterBar === "string" || typeof filterBar === "number" ? (
        <Text>{filterBar}</Text>
      ) : (
        filterBar
      )}
      {hasColumnTools ? (
        <View className="flex-row justify-end">
          <ColumnEditor collection={collection} isIconOnly />
        </View>
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
          emptyState={empty}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
          {...(collection.paging === "infinite"
            ? { hasMore: collection.hasMore, onLoadMore: collection.loadMore }
            : {})}
          {...(scrollEnabled === undefined ? {} : { scrollEnabled })}
        />
      )}
      {hasPager && !hasError ? (
        <CursorPagination
          label={paginationLabel}
          hasMore={collection.hasMore}
          hasPrevious={state.page > 0}
          onNext={() =>
            collection.paging === "page"
              ? collection.setPage(state.page + 1)
              : collection.loadMore()
          }
          onPrevious={() => collection.setPage(state.page - 1)}
          count={rows.length}
          isLoading={isLoading && hasRows}
        />
      ) : null}
      {selectionMode === "multiple" ? (
        <BulkActionBar
          label={bulkActionsLabel}
          selectedCount={selected.length}
          actions={bulkActions ?? []}
          isPageSelected={hasRows && rows.every((item) => selected.includes(item.id))}
          isAllMatchingSelected={state.isAllMatchingSelected}
          onClearSelection={() => changeSelection([])}
          totalCount={
            state.isAllMatchingSelected
              ? Math.max(0, collection.totalCount - state.excludedKeys.length)
              : collection.totalCount
          }
          onAllMatchingSelectedChange={collection.setAllMatchingSelected}
        />
      ) : null}
    </View>
  );
}
