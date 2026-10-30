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
 *          `groupBy`, `aggregates` and `hiddenColumns` go through `useDataTableLayout`: group heading and total rows
 *          are drawn in the rows, kept out of the selection and given no row actions.
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
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (group-by, aggregates, hidden columns); ADR 0165 (HeroUI Native on native); ADR 0303 (decision 7); ADR 0313; ADR 0318
 *          (decisions 2, 4 to 6 and 10); ADR 0139 (action UX); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1, 2.5.8, 4.1.2;
 *          owner decision 6 of STA-350 (thin wrappers).
 */
import { useContext, useState, type ReactElement } from "react";
import { View } from "react-native";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDataTableLayout } from "#react/data-table/use-data-table-layout";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import type { CollectionItem } from "#contracts/types/collection-item.type";
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
import type { DataTableProps } from "#native/data-table/data-table.props";

/** The id of the row menus' column: the app's columns never use it. */
const ACTIONS_COLUMN_ID = "data-table-row-actions";

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
  retryLabel: retryLabelProp,
  headingLevel = 3,
  paginationLabel: paginationLabelProp,
  bulkActionsLabel: bulkActionsLabelProp,
  totalCount,
  isAllMatchingSelected = false,
  onAllMatchingSelectedChange,
  groupBy,
  aggregates,
  hiddenColumns,
  scrollEnabled,
  className,
  ...rest
}: DataTableProps<TItem>): ReactElement {
  const t = useUiText();
  // Read softly: a table with no aggregates needs no provider, and numbers fall back to English.
  const locale = useContext(DesignSystemContext)?.locale ?? "en";
  const layout = useDataTableLayout({ items, columns, groupBy, aggregates, hiddenColumns, locale });
  const retryLabel = retryLabelProp ?? t(UI_KEYS.ui.data_table.retry);
  const paginationLabel = paginationLabelProp ?? t(UI_KEYS.ui.data_table.pagination, { label });
  const bulkActionsLabel = bulkActionsLabelProp ?? t(UI_KEYS.ui.data_table.bulk_actions, { label });
  const actionsColumn: TableColumn = {
    id: ACTIONS_COLUMN_ID,
    label: t(UI_KEYS.ui.data_table.actions_column),
    align: "end",
  };
  const { pending, run } = usePendingActions();
  // The selection is kept here only so the bar can count it; a controlled `selectedKeys` always wins.
  const [own, setOwn] = useState<readonly string[]>(defaultSelectedKeys ?? []);
  const selected = selectedKeys ?? own;
  const hasError = error !== undefined && error !== null;
  const isFiltered = isResourceQueryFiltered(query);
  const hasRows = items.length > 0;
  const rowHeaderId = (columns.find((column) => column.isRowHeader) ?? columns[0])?.id ?? "";

  const changeSelection = (picked: readonly string[]) => {
    const keys = picked.filter((key) => !layout.isSummary(key));
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

  const empty = isFiltered
    ? (filteredEmptyState ?? (
        <EmptyState
          reason="no-results"
          headingLevel={headingLevel}
          title={t(UI_KEYS.ui.data_table.no_results_title)}
          description={t(UI_KEYS.ui.data_table.no_results_description)}
          actions={
            <Button
              variant="secondary"
              onPress={() => onQueryChange(clearResourceQueryFilters(query))}
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
          sortDescriptor={query.sort ?? undefined}
          onSortChange={(sort) => onQueryChange({ ...query, sort })}
          emptyState={empty}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
          {...(scrollEnabled === undefined ? {} : { scrollEnabled })}
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
