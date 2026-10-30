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
 *          pages), and passes every other `div` prop to its root. The row tools of wave 3 (`DataTableRows`): drag to
 *          reorder (React Aria drag and drop, a handle per row), the row actions as hover buttons and as a right-click
 *          or Shift+F10 menu, expandable rows with "expand all", a row opened in the shared side panel, inline edit of
 *          marked columns with the DataGrid's own editor and rules, and with "select all N" the boxes of every page
 *          shown ticked. With `isVirtualized` (wave 4) only the rows in view are drawn, through the Table's virtual
 *          scrolling.
 * Boundary: given a `collection` (DataView's), every change goes to it. Without one the table runs its own engine in
 *           server mode over the rows it is given, so it never sorts or filters them: `query.sort`, `selectedKeys`,
 *           `isAllMatchingSelected`, `groupBy`, `aggregates` and `density` stay controlled when given, and a header press
 *           calls `onQueryChange` with the next query, as before. `hiddenColumns` hides columns over the engine's own
 *           (the row header is always drawn). Group heading and total rows are drawn in the rows, kept out of the
 *           selection and given no row actions; the total row sticks to the bottom of a sticky-header table. When the
 *           selection empties while the bar had focus the browser drops focus on the page, so focus moves to the table's
 *           container instead (WCAG 2.4.3). Detail rows, like group and total rows, are synthetic: never selected,
 *           dragged, reordered, actioned or edited. The edit box is a portal over the cell, so the grid's keys never
 *           act on what is typed; the chevron, the drag handle and the menus follow the logical direction, and the
 *           hover reveal stops under prefers-reduced-motion. A row action is pending while its promise is, shown as a
 *           disabled item that says so, and refuses a second run. It never imports `FilterBar`, which is built beside it.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); product audit 2026-10-28 (group-by, aggregates, hidden columns);
 *          data-collection plan (owner, 2026-10-29); ADR 0165 (UI contract); ADR 0303 (decision 7); ADR 0313; ADR 0318
 *          (decisions 2 and 4 to 6); ADR 0139 (action UX); WCAG 2.2 SC 1.3.1, 2.4.3, 4.1.2, 4.1.3; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
} from "react";
import { Button as AriaButton, useLocale } from "react-aria-components";
import type { DataGridColumn } from "#contracts/types/data-grid-column.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { MenuLeafItem } from "#contracts/types/menu-leaf-item.type";
import type { TableColumn } from "#contracts/types/table-column.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useCollection } from "#react/hooks/use-collection";
import { useUiText } from "#react/hooks/use-ui-text";
import { useDataTableLayout } from "#react/data-table/use-data-table-layout";
import { ActionMenu } from "#react/action-menu/action-menu";
import { BulkActionBar } from "#react/bulk-action-bar/bulk-action-bar";
import { usePendingActions } from "#react/hooks/use-pending-actions";
import { Button } from "#react/button/button";
import { CursorPagination } from "#react/cursor-pagination/cursor-pagination";
import { COLLECTION_ICONS } from "#react/data-table/collection-icons.constant";
import { CollectionRowPanel } from "#react/data-table/collection-row-panel";
import { ColumnMenu } from "#react/data-table/column-menu";
import { DataTableCellEditor } from "#react/data-table/data-table-cell-editor";
import { ContextMenu } from "#react/context-menu/context-menu";
import { Icon } from "#react/icon/icon";
import { IconButton } from "#react/icon-button/icon-button";
import { EmptyState } from "#react/empty-state/empty-state";
import { ErrorState } from "#react/error-state/error-state";
import { PageSkeleton } from "#react/page-skeleton/page-skeleton";
import { Table } from "#react/table/table";
import type { DataTableProps } from "#react/data-table/data-table.props";

/** The id of the row menus' column: the app's columns never use it. */
const ACTIONS_COLUMN_ID = "data-table-row-actions";

/** The id of the disclosure column: the app's columns never use it. */
const EXPAND_COLUMN_ID = "data-table-row-expand";

/** The id prefix of an expanded row's detail row; an app's ids never start with it. */
const DETAIL_PREFIX = "data-table-detail:";

/** True for an expanded row's detail row. */
const isDetail = (id: string) => id.startsWith(DETAIL_PREFIX);

/** The words of the row tools. */
const K = COLLECTION_KEYS.ui.collection;

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
  onReorder,
  hasHoverActions = false,
  hasContextMenu = true,
  renderRowDetail,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  onRowOpen,
  renderRowPanel,
  editableColumns,
  onCellEdit,
  isVirtualized = false,
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
      if (next.sort[0] !== before.sort[0]) onQueryChange({ ...query, sort: next.sort[0] ?? null });
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
  // The tool columns have their size, so the app's last column is the one that fills the row.
  const firstItem = items[0];
  const hoverCount =
    hasHoverActions && rowActions && firstItem
      ? rowActions(firstItem).filter((action) => action.icon !== undefined && !action.href).length
      : 0;
  const actionsColumn: TableColumn = {
    id: ACTIONS_COLUMN_ID,
    label: t(UI_KEYS.ui.data_table.actions_column),
    align: "end",
    width: 96 + hoverCount * 36,
    isResizable: false,
  };
  const container = useRef<HTMLDivElement>(null);
  const { pending, run } = usePendingActions();
  // With "select all N" chosen, every page's boxes show ticked but the rows unticked since (the engine holds the choice
  // and the exclusions, not the ids).
  const pageIds = layout.items.filter((item) => !layout.isSummary(item.id)).map((item) => item.id);
  const selected = state.isAllMatchingSelected
    ? pageIds.filter((id) => !state.excludedKeys.includes(id))
    : state.selection;
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
  const nameOf = (item: TItem) => cellTextOf(item, rowHeaderId) || item.id;

  // Expanded rows: a synthetic detail row after each, drawn as one cell across the table.
  const [ownExpanded, setOwnExpanded] = useState<readonly string[]>(defaultExpandedKeys ?? []);
  const expanded = expandedKeys ?? ownExpanded;
  const changeExpanded = (next: readonly string[]) => {
    setOwnExpanded(next);
    onExpandedChange?.(next);
  };
  const isExpandable = renderRowDetail !== undefined;
  const isSynthetic = (id: string) => layout.isSummary(id) || isDetail(id);
  const realIds = layout.items.filter((item) => !layout.isSummary(item.id)).map((item) => item.id);
  const isAllExpanded = realIds.length > 0 && realIds.every((id) => expanded.includes(id));
  const rows = isExpandable
    ? layout.items.flatMap((item) =>
        expanded.includes(item.id) && !layout.isSummary(item.id)
          ? [item, { id: `${DETAIL_PREFIX}${item.id}` } as TItem]
          : [item],
      )
    : layout.items;
  const syntheticIds = rows.filter((item) => isSynthetic(item.id)).map((item) => item.id);
  const itemOf = (id: string) => items.find((item) => item.id === id);

  // A row opened in the side panel (with `renderRowPanel`), and the cell being edited in place.
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = openId === null ? null : (itemOf(openId) ?? null);
  const isOpenable = onRowOpen !== undefined || renderRowPanel !== undefined;
  const [editing, setEditing] = useState<{
    readonly item: TItem;
    readonly column: DataGridColumn;
    readonly anchor: HTMLElement;
    readonly trigger: HTMLElement;
  } | null>(null);
  const editColumnOf = (id: string) =>
    editableColumns?.find((column) => column.id === id && !column.isReadOnly);
  // The row a right-click or Shift+F10 is over; a press outside a record row leaves the browser's own menu.
  const [contextId, setContextId] = useState<string | null>(null);

  const changeSelection = (keys: readonly string[]) => {
    const picked = keys.filter((key) => !isSynthetic(key));
    if (!state.isAllMatchingSelected) {
      collection.setSelection(picked);
      return;
    }
    // Unticking a row while every match is chosen keeps the choice and remembers the row as an exception.
    const offPage = state.excludedKeys.filter((id) => !pageIds.includes(id));
    collection.setExcludedKeys([...offPage, ...pageIds.filter((id) => !picked.includes(id))]);
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
    if (column.id === EXPAND_COLUMN_ID) {
      const isOpen = expanded.includes(item.id);
      // The cell is a focus target of its own (grid navigation), so it keeps a 24px strip beside the button (SC 2.5.8).
      return (
        <div className="flex justify-end">
          <IconButton
            // Shut, it points the reading way (the icon mirrors itself in right-to-left); open, it points down.
            icon={isOpen ? "chevron-down" : "chevron-right"}
            label={t(isOpen ? K.collapse_row : K.expand_row, { name: nameOf(item) })}
            aria-expanded={isOpen}
            variant="ghost"
            size="sm"
            onPress={() =>
              changeExpanded(
                isOpen ? expanded.filter((id) => id !== item.id) : [...expanded, item.id],
              )
            }
          />
        </div>
      );
    }
    if (column.id === ACTIONS_COLUMN_ID) {
      const menuItems = menuItemsOf(item);
      if (menuItems.length === 0) return null;
      const name = nameOf(item);
      const hoverItems = hasHoverActions
        ? menuItems.flatMap((action) =>
            action.icon !== undefined && action.href === undefined
              ? [{ ...action, icon: action.icon }]
              : [],
          )
        : [];
      // The cell is a focus target of its own (grid navigation), so it keeps a 24px strip beside the button (SC 2.5.8).
      return (
        <div className="flex items-center justify-end gap-1 ps-6">
          {hoverItems.map((action) => (
            <IconButton
              key={action.id}
              icon={action.icon}
              label={action.label}
              variant="ghost"
              size="sm"
              isDisabled={action.isDisabled}
              onPress={action.onPress}
              // Shown while the pointer is over the row or focus is in it; touch reaches them through the menu.
              className="opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 motion-reduce:transition-none"
            />
          ))}
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
    const content = renderCell ? renderCell(item, column) : cellTextOf(item, column.id);
    const editColumn = onCellEdit ? editColumnOf(column.id) : undefined;
    if (!editColumn) return content;
    // A button over the value: a press (Enter from the keyboard) lays the DataGrid's editor over the cell. Its text
    // lines up with the header; the cell, a focus target of its own (grid navigation), keeps a 24px strip at the
    // other side (SC 2.5.8).
    return (
      <AriaButton
        className={
          cn(
            "group/edit flex w-[calc(100%-0.25rem)] min-w-0 cursor-text items-center gap-1 rounded-[var(--radius-control)] px-2 py-0.5 text-start outline-none hover:bg-default data-[focus-visible]:outline-2 data-[focus-visible]:outline-focus",
            column.align === "end" ? "-me-2 ms-auto" : "-ms-2",
          ) ?? ""
        }
        onPress={(event) => {
          const trigger = event.target as HTMLElement;
          const anchor =
            trigger.closest<HTMLElement>('[role="gridcell"], [role="rowheader"]') ?? trigger;
          setEditing({ item, column: editColumn, anchor, trigger });
        }}
      >
        <span className={cn("min-w-0 flex-1 truncate", column.align === "end" && "text-end")}>
          {content}
        </span>
        <Icon
          name="pencil"
          size="sm"
          className="shrink-0 text-muted opacity-0 transition-opacity group-hover/edit:opacity-100 group-data-[focus-visible]/edit:opacity-100 motion-reduce:transition-none"
        />
        <span className="sr-only">
          {t(K.edit_cell, { column: column.label, name: nameOf(item) })}
        </span>
      </AriaButton>
    );
  };

  const expandColumn: TableColumn = {
    id: EXPAND_COLUMN_ID,
    label: t(K.details_column),
    // The 32px button, the cell's 16px sides and the 24px strip the cell keeps beside it.
    width: 72,
    isResizable: false,
  };
  // The app's row header stays the row header when the disclosure column comes first.
  const appColumns = layout.columns.map((column) =>
    column.id === rowHeaderId ? { ...column, isRowHeader: true } : column,
  );
  const tableColumns = [
    ...(isExpandable ? [expandColumn] : []),
    ...appColumns,
    ...(rowActions ? [actionsColumn] : []),
  ];
  const isOwnColumn = (id: string) => id === ACTIONS_COLUMN_ID || id === EXPAND_COLUMN_ID;
  const contextItem = contextId === null ? undefined : itemOf(contextId);
  // The row under a right-click or the focus; anything else (a header, a group row) keeps the browser's menu.
  const pickContextRow = (target: EventTarget | null, event: { stopPropagation: () => void }) => {
    const id =
      target instanceof Element
        ? target.closest("[role=row][data-key]")?.getAttribute("data-key")
        : undefined;
    const item = id && !isSynthetic(id) ? itemOf(id) : undefined;
    if (!item || menuItemsOf(item).length === 0) {
      event.stopPropagation();
      return;
    }
    setContextId(item.id);
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
  const isContextMenu = rowActions !== undefined && hasContextMenu;

  const view = (
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
            onClearSelection={() => collection.setSelection([])}
            {...(total === undefined
              ? {}
              : {
                  totalCount: state.isAllMatchingSelected
                    ? Math.max(0, total - state.excludedKeys.length)
                    : total,
                })}
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
          // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: the wrapper only notes which row a right-click or Shift+F10 is over, before the context menu opens; it is not a control
          <div
            className="min-w-0"
            {...(isContextMenu
              ? {
                  onContextMenuCapture: (event: MouseEvent) => pickContextRow(event.target, event),
                  onKeyDownCapture: (event: KeyboardEvent) => {
                    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))
                      pickContextRow(document.activeElement, event);
                  },
                }
              : {})}
          >
            <ContextMenu
              // Named for the row once one is picked; until then the menu has no row, so it takes the table's name.
              label={
                contextItem
                  ? t(UI_KEYS.ui.data_table.row_actions, { name: nameOf(contextItem) })
                  : label
              }
              isDisabled={!isContextMenu}
              sections={[
                {
                  id: "row-actions",
                  title: t(UI_KEYS.ui.data_table.actions_column),
                  isTitleHidden: true,
                  items: contextItem ? menuItemsOf(contextItem) : [],
                },
              ]}
            >
              <Table
                label={label}
                items={rows}
                columns={tableColumns}
                renderCell={cellOf}
                disabledKeys={syntheticIds}
                fixedColumns={[EXPAND_COLUMN_ID, ACTIONS_COLUMN_ID]}
                {...(isExpandable
                  ? {
                      renderRowSpan: (item: TItem) => {
                        if (!isDetail(item.id)) return undefined;
                        const owner = itemOf(item.id.slice(DETAIL_PREFIX.length));
                        return owner ? (
                          <div
                            role="group"
                            aria-label={t(K.row_detail, { name: nameOf(owner) })}
                            className="py-2"
                          >
                            {renderRowDetail(owner)}
                          </div>
                        ) : null;
                      },
                      renderHeader: (column: TableColumn) =>
                        column.id === EXPAND_COLUMN_ID ? (
                          <IconButton
                            icon={isAllExpanded ? "chevrons-down-up" : "chevrons-up-down"}
                            label={t(isAllExpanded ? K.collapse_all : K.expand_all)}
                            variant="ghost"
                            size="sm"
                            onPress={() => changeExpanded(isAllExpanded ? [] : realIds)}
                          />
                        ) : undefined,
                    }
                  : {})}
                {...(onReorder
                  ? {
                      onReorder: (next: readonly TItem[]) =>
                        onReorder(next.filter((item) => !isSynthetic(item.id))),
                    }
                  : {})}
                {...(isOpenable
                  ? {
                      onRowAction: (id: string) => {
                        const item = isSynthetic(id) ? undefined : itemOf(id);
                        if (!item) return;
                        onRowOpen?.(item);
                        if (renderRowPanel) setOpenId(id);
                      },
                    }
                  : {})}
                variant={variant}
                isVirtualized={isVirtualized}
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
                rowClassName={(item) =>
                  cn(
                    "group/row",
                    layout.isTotal(item.id) && TOTAL_ROW_CLASS,
                    isOpenable && !isSynthetic(item.id) && "cursor-pointer",
                  )
                }
                {...(isEngineInfinite
                  ? { hasMore: given.hasMore, onLoadMore: given.loadMore }
                  : {})}
                {...(isResizable
                  ? {
                      isColumnResizable: true,
                      onColumnResize: (id: string, width: number) => {
                        if (isOwnColumn(id)) return;
                        collection.updateColumn(id, { width });
                        onColumnResize?.(id, width);
                      },
                    }
                  : {})}
                {...(hasColumnTools || onColumnMove
                  ? {
                      onColumnMove: (id: string, at: number) => {
                        if (isOwnColumn(id)) return;
                        // The table counts the disclosure column; the engine does not.
                        const toIndex = Math.max(0, at - (isExpandable ? 1 : 0));
                        collection.moveColumn(id, toIndex);
                        onColumnMove?.(id, toIndex);
                      },
                    }
                  : {})}
                {...(hasColumnTools
                  ? {
                      renderColumnMenu: (
                        column: TableColumn,
                        tools: { readonly startResize: () => void },
                      ) => {
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
            </ContextMenu>
          </div>
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
        {editing ? (
          <DataTableCellEditor
            column={editing.column}
            row={editing.item as unknown as DataGridRow}
            anchor={editing.anchor}
            label={t(K.edit_cell, { column: editing.column.label, name: nameOf(editing.item) })}
            locale={locale}
            onCommit={(value) => {
              const { item, column, trigger } = editing;
              setEditing(null);
              trigger.focus();
              void onCellEdit?.(item, column.id, value);
            }}
            onCancel={() => {
              setEditing(null);
              editing.trigger.focus();
            }}
          />
        ) : null}
      </div>
    </IconRegistryProvider>
  );

  return renderRowPanel ? (
    <CollectionRowPanel
      label={label}
      item={openItem}
      title={openItem ? nameOf(openItem) : ""}
      renderPanel={renderRowPanel}
      onClose={() => setOpenId(null)}
    >
      {view}
    </CollectionRowPanel>
  ) : (
    view
  );
}
