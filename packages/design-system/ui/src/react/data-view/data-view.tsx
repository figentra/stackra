/**
 * Stackra file contract:
 * Purpose: the web `DataView`, one composed data component over a `useCollection` engine: a toolbar (saved views, quick
 *          search, the and/or filter with its chips, the multi-sort, group by, the column editor, density, the view
 *          switcher, export, import, refresh and full screen) and, below it, the active view drawn from the same state,
 *          so switching between Table, Grid, List and Cards keeps the search, filter, sort and columns. The board of
 *          wave 4 is drawn from `board` (or any view through `renderLayout`). Under 37.5rem of its own width the toolbar keeps
 *          the search and the filter and moves every other tool (the view switcher too) into a "More tools" drawer; a phone
 *          opens on the list (or cards) view when the engine was never switched. The table view takes the row tools of
 *          wave 3 (drag to reorder, hover and context actions, expand, inline edit), and `renderRowPanel` opens a
 *          table row, a list row or a card in the shared side panel beside whichever view is shown. Wave 4 (scale):
 *          `isVirtualized` draws only what is in view in every view (10,000 rows and more), `infinite` paging loads
 *          the next page at the end of any view, and under `cardsBelow` (600 px) of its own width the table is drawn
 *          as cards without changing the engine's layout.
 * Boundary: it keeps no data state: every tool changes the engine (persisted by its collection key). The filter and sort
 *           editors sit in popovers on wide containers and in bottom drawers on narrow ones. The result count is a
 *           polite status. The one pager (`CollectionPager`) is drawn here under every view, so the table and grid inside
 *           draw none. Full screen is the browser's own, on the DataView's root, and follows Escape. Words come from
 *           the `ui` catalogue in the active locale; icons from `COLLECTION_ICONS`.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0505 (one data family: the
 *          grid and inline-edit columns are the engine's, one pager, one SavedViews); ADR 0165 (React Aria on web);
 *          WCAG 2.2 SC 1.3.1, 1.4.10, 2.1.1, 2.4.3, 4.1.2, 4.1.3.
 */
import { cn } from "@heroui/react";
import { IconRegistryProvider } from "@stackra/icons/react";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";

import type { CollectionDensity } from "#contracts/enums/collection-density.enum";
import type { CollectionLayout } from "#contracts/enums/collection-layout.enum";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { DataGridRow } from "#contracts/types/data-grid-row.type";
import type { RuleCondition } from "#contracts/types/rule-condition.type";
import { COLLECTION_KEYS } from "#core/constants/collection-keys.constant";
import { cellTextOf } from "#core/functions/cell-text-of.function";
import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { conditionChipTextOf } from "#core/functions/condition-chip-text-of.function";
import { filterConditionCountOf } from "#core/functions/filter-condition-count-of.function";
import { Button } from "#react/button/button";
import { Chip } from "#react/chip/chip";
import { CloseButton } from "#react/close-button/close-button";
import { ColumnEditor } from "#react/column-chooser/column-editor";
import { ColumnEditorPanel } from "#react/column-chooser/column-editor-panel";
import { DataGrid } from "#react/data-grid/data-grid";
import { COLLECTION_ICONS } from "#react/data-table/collection-icons.constant";
import { CollectionPager } from "#react/data-table/collection-pager";
import { CollectionPagerContext } from "#react/data-table/collection-pager-context";
import { CollectionRowPanel } from "#react/data-table/collection-row-panel";
import { DataTable } from "#react/data-table/data-table";
import { CollectionFilterEditor } from "#react/data-view/collection-filter-editor";
import { CollectionSortEditor } from "#react/data-view/collection-sort-editor";
import { DataViewBoard } from "#react/data-view/data-view-board";
import { DataViewCards } from "#react/data-view/data-view-cards";
import { DATA_VIEW_ICONS as I } from "#react/data-view/data-view-icons.constant";
import type { DataViewProps } from "#react/data-view/data-view.props";
import { Drawer } from "#react/drawer/drawer";
import { ExportDialog } from "#react/export-dialog/export-dialog";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import { ImportDialog } from "#react/import-dialog/import-dialog";
import { Menu } from "#react/menu/menu";
import { Popover } from "#react/popover/popover";
import { SavedViews } from "#react/saved-views/saved-views";
import { SearchField } from "#react/search-field/search-field";
import { SegmentedControl } from "#react/segmented-control/segmented-control";

/** The words. */
const K = COLLECTION_KEYS.ui.collection;

/** The container width, in CSS pixels, under which the toolbar folds its tools into "More tools" (a phone, a narrow column). */
const NARROW = 600;

/** The densities, in order. */
const DENSITIES: readonly CollectionDensity[] = ["compact", "normal", "roomy"];

/** A collection drawn as a table, grid, list or cards under one toolbar. */
export function DataView<TItem extends CollectionItem = CollectionItem>({
  label,
  collection,
  layouts: givenLayouts,
  phoneLayout = "list",
  renderCell,
  list,
  cards,
  onItemPress,
  rowActions,
  bulkActions,
  selectionMode,
  onGridSave,
  exportOptions,
  importOptions,
  onShareView,
  onRefresh,
  hasFullscreen = true,
  renderLayout,
  emptyState,
  onReorder,
  hasHoverActions,
  hasContextMenu,
  renderRowDetail,
  expandedKeys,
  defaultExpandedKeys,
  onExpandedChange,
  onRowOpen,
  renderRowPanel,
  onCellEdit,
  isVirtualized = false,
  cardsBelow = NARROW,
  board,
  className,
  ...rest
}: DataViewProps<TItem>): ReactElement {
  const t = useUiText();
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1024);
  const [isFullscreen, setFullscreen] = useState(false);
  const { state } = collection;
  const layouts: readonly CollectionLayout[] = givenLayouts ?? [
    "table" as const,
    ...(onGridSave ? (["grid"] as const) : []),
    "list" as const,
    "cards" as const,
    ...(board ? (["board"] as const) : []),
  ];
  const layout = layouts.includes(state.layout) ? state.layout : (layouts[0] ?? "table");
  const isNarrow = width < NARROW;
  // A table too narrow for its columns is drawn as cards; the engine keeps `table`, so a wider frame shows it again.
  const isTableAsCards = layout === "table" && cardsBelow !== null && width < cardsBelow;
  // The record open in the side panel, from any view.
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem =
    openId === null ? null : (collection.rows.find((item) => item.id === openId) ?? null);
  const openRow = (item: TItem) => {
    onRowOpen?.(item);
    if (renderRowPanel) setOpenId(item.id);
  };
  const rowHeaderId =
    (collection.columns.find((column) => column.isRowHeader) ?? collection.columns[0])?.id ?? "";

  useEffect(() => {
    const element = root.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    setWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    // A phone opens on the list or cards view while the engine still has the default table.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(max-width: 639px)").matches &&
      state.layout === "table" &&
      state.viewId === null &&
      layouts.includes(phoneLayout)
    )
      collection.setLayout(phoneLayout);
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: once, on mount
  }, []);
  useEffect(() => {
    const follow = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", follow);
    return () => document.removeEventListener("fullscreenchange", follow);
  }, []);

  const filterCount = filterConditionCountOf(state.filter);
  const fieldLabel = (id: string) =>
    collection.columns.find((column) => column.id === id)?.label ?? id;
  const chipText = (condition: RuleCondition) =>
    conditionChipTextOf(condition, collection.columns, (operator) =>
      t(UI_KEYS.ui.rule_operator[operator]),
    );
  const groupable = collection.columns.filter((column) => column.isGroupable);
  const refresh = onRefresh ?? (collection.mode === "server" ? collection.refresh : undefined);
  const selected = state.selection.length;
  const layoutIcon: Record<CollectionLayout, (typeof I)[keyof typeof I]> = {
    table: I.table,
    grid: I.grid,
    list: I.list,
    cards: I.cards,
    board: I.board,
  };

  const search = (
    <SearchField
      aria-label={t(K.search, { label })}
      placeholder={t(K.search, { label })}
      value={state.search}
      onChange={collection.setSearch}
      isFullWidth
      isLoading={collection.isLoading && state.search !== ""}
    />
  );
  const filterTrigger = (
    <Button variant="secondary" size="sm" startIcon={I.filter}>
      {t(K.filter_count, { count: filterCount })}
    </Button>
  );
  const filterEditor = <CollectionFilterEditor collection={collection} label={label} />;
  const sortTrigger = (
    <Button variant="secondary" size="sm" startIcon={I.sort}>
      {t(K.sort_count, { count: state.sort.length })}
    </Button>
  );
  const sortEditor = <CollectionSortEditor collection={collection} label={label} />;
  const groupMenu =
    groupable.length > 0 ? (
      <Menu
        selectionMode="single"
        value={[state.groupBy ?? "none"]}
        onChange={(keys) => {
          const key = keys[0];
          collection.setGroupBy(key === undefined || key === "none" ? null : key);
        }}
        sections={[
          {
            id: "group",
            title: t(K.group_by),
            items: [
              { id: "none", label: t(K.group_none) },
              ...groupable.map((column) => ({ id: column.id, label: column.label })),
            ],
          },
        ]}
      >
        <Button variant="secondary" size="sm" startIcon={I.group}>
          {state.groupBy ? `${t(K.group)}: ${fieldLabel(state.groupBy)}` : t(K.group)}
        </Button>
      </Menu>
    ) : null;
  const densityMenu = (
    <Menu
      selectionMode="single"
      value={[state.density]}
      onChange={(keys) => {
        const key = DENSITIES.find((density) => density === keys[0]);
        if (key) collection.setDensity(key);
      }}
      sections={[
        {
          id: "density",
          title: t(K.density),
          items: DENSITIES.map((density) => ({
            id: density,
            label: t(K[`density_${density}`]),
          })),
        },
      ]}
    >
      <IconButton icon={I.density} label={t(K.density)} variant="secondary" size="sm" />
    </Menu>
  );
  const switcher =
    layouts.length > 1 ? (
      <SegmentedControl
        label={t(K.layout)}
        size="sm"
        selectedKey={layout}
        onSelectionChange={(key) => {
          const next = layouts.find((entry) => entry === key);
          if (next) collection.setLayout(next);
        }}
        items={layouts.map((entry) => ({
          id: entry,
          label: t(K[`layout_${entry}`]),
          icon: layoutIcon[entry],
        }))}
      />
    ) : null;
  const exportButton = exportOptions ? (
    <ExportDialog
      {...exportOptions}
      counts={
        exportOptions.counts ?? {
          ...(selected > 0 ? { selection: selected } : {}),
          ...(collection.isFiltered ? { filtered: collection.totalCount } : {}),
          all: collection.totalCount,
        }
      }
      trigger={
        <Button variant="secondary" size="sm" startIcon={I.export}>
          {t(K.export)}
        </Button>
      }
    />
  ) : null;
  const importButton = importOptions ? (
    <ImportDialog
      {...importOptions}
      trigger={
        <Button variant="secondary" size="sm" startIcon={I.import}>
          {t(K.import)}
        </Button>
      }
    />
  ) : null;
  const refreshButton = refresh ? (
    <IconButton
      icon={I.refresh}
      label={t(K.refresh)}
      variant="secondary"
      size="sm"
      isLoading={collection.isLoading}
      onPress={refresh}
    />
  ) : null;
  const fullscreenButton =
    hasFullscreen && typeof document !== "undefined" && document.fullscreenEnabled !== false ? (
      <IconButton
        icon={isFullscreen ? I.exitFullscreen : I.fullscreen}
        label={t(isFullscreen ? K.exit_fullscreen : K.fullscreen)}
        variant="secondary"
        size="sm"
        onPress={() => {
          if (document.fullscreenElement) void document.exitFullscreen?.();
          else void root.current?.requestFullscreen?.();
        }}
      />
    ) : null;

  const toolbar = isNarrow ? (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{search}</div>
      <Drawer placement="bottom" trigger={filterTrigger} label={t(K.filter_title, { label })}>
        <Drawer.Header>
          <Drawer.Title>{t(K.filter_title, { label })}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>{filterEditor}</Drawer.Body>
        <Drawer.Footer>
          <Button slot="close">{t(K.done)}</Button>
        </Drawer.Footer>
      </Drawer>
      <Drawer
        placement="bottom"
        label={t(K.more_tools)}
        trigger={<IconButton icon={I.more} label={t(K.more_tools)} variant="secondary" size="sm" />}
      >
        <Drawer.Header>
          <Drawer.Title>{t(K.more_tools)}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <div className="grid gap-5">
            <SavedViews collection={collection} onShareView={onShareView} />
            {switcher}
            <section className="grid gap-2" aria-label={t(K.sort)}>
              <h3 className="m-0 text-sm font-medium">{t(K.sort)}</h3>
              {sortEditor}
            </section>
            <div className="flex flex-wrap gap-2">
              {groupMenu}
              {densityMenu}
              {exportButton}
              {importButton}
              {refreshButton}
            </div>
            {(layout === "table" && !isTableAsCards) || layout === "grid" ? (
              <section className="grid gap-2" aria-label={t(K.editor_title)}>
                <h3 className="m-0 text-sm font-medium">{t(K.editor_title)}</h3>
                <ColumnEditorPanel collection={collection} />
              </section>
            ) : null}
          </div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button slot="close">{t(K.done)}</Button>
        </Drawer.Footer>
      </Drawer>
    </div>
  ) : (
    <div className="flex flex-wrap items-center gap-2">
      <SavedViews collection={collection} onShareView={onShareView} />
      <div className="min-w-48 flex-1">{search}</div>
      <Popover
        title={t(K.filter_title, { label })}
        trigger={filterTrigger}
        placement="bottom"
        align="start"
      >
        <div className="w-[min(40rem,calc(100vw-2rem))]">{filterEditor}</div>
      </Popover>
      <Popover
        title={t(K.sort_title, { label })}
        trigger={sortTrigger}
        placement="bottom"
        align="start"
      >
        <div className="w-[min(22rem,calc(100vw-2rem))]">{sortEditor}</div>
      </Popover>
      {groupMenu}
      {(layout === "table" && !isTableAsCards) || layout === "grid" ? (
        <ColumnEditor collection={collection} />
      ) : null}
      {densityMenu}
      {switcher}
      {exportButton}
      {importButton}
      {refreshButton}
      {fullscreenButton}
    </div>
  );

  const chips =
    state.filter.conditions.length > 0 || (state.filter.groups ?? []).length > 0 ? (
      <ul
        className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0"
        aria-label={t(K.filter)}
      >
        {state.filter.conditions.map((condition) => (
          <li key={condition.id} className="inline-flex items-center gap-0.5">
            <Chip variant="secondary">{chipText(condition)}</Chip>
            <CloseButton
              label={t(K.remove_filter, { text: chipText(condition) })}
              onPress={() =>
                collection.setFilter({
                  ...state.filter,
                  conditions: state.filter.conditions.filter((entry) => entry.id !== condition.id),
                })
              }
            />
          </li>
        ))}
        {(state.filter.groups ?? []).map((group, index) => (
          <li key={group.id ?? index} className="inline-flex items-center gap-0.5">
            <Chip variant="secondary">{`${t(K.group_match, { index: index + 1 })} (${group.conditions.length})`}</Chip>
            <CloseButton
              label={t(K.remove_filter, { text: t(K.group_match, { index: index + 1 }) })}
              onPress={() =>
                collection.setFilter({
                  ...state.filter,
                  groups: (state.filter.groups ?? []).filter((_, at) => at !== index),
                })
              }
            />
          </li>
        ))}
      </ul>
    ) : null;

  const tableSelection = selectionMode ?? (bulkActions ? "multiple" : "none");
  const openItemPress =
    renderRowPanel || onRowOpen
      ? (item: TItem) => {
          onItemPress?.(item);
          openRow(item);
        }
      : onItemPress;
  const body: ReactNode =
    renderLayout?.[layout]?.() ??
    (layout === "board" && board ? (
      <DataViewBoard
        collection={collection}
        label={label}
        board={{ ...board, card: board.card ?? cards }}
        renderCell={renderCell}
        onItemPress={openItemPress}
        isVirtualized={isVirtualized}
      />
    ) : null) ??
    (layout === "grid" ? (
      <DataGrid
        label={label}
        // A cast: the app offers the grid (`onGridSave`) over rows whose cells are grid values.
        collection={collection as unknown as CollectionController<DataGridRow>}
        hasColumnTools
        onSave={onGridSave}
      />
    ) : layout === "list" || layout === "cards" || isTableAsCards ? (
      <DataViewCards
        collection={collection}
        label={label}
        layout={layout === "list" ? "list" : "cards"}
        fields={layout === "list" ? list : cards}
        renderCell={renderCell}
        onItemPress={openItemPress}
        isVirtualized={isVirtualized}
      />
    ) : (
      <DataTable
        label={label}
        collection={collection}
        hasColumnTools
        isStickyHeader
        isVirtualized={isVirtualized}
        maxHeight={isFullscreen ? "calc(100vh - 12rem)" : "32rem"}
        renderCell={renderCell}
        rowActions={rowActions}
        bulkActions={bulkActions}
        selectionMode={tableSelection}
        emptyState={emptyState}
        onReorder={onReorder}
        hasHoverActions={hasHoverActions}
        hasContextMenu={hasContextMenu}
        renderRowDetail={renderRowDetail}
        expandedKeys={expandedKeys}
        defaultExpandedKeys={defaultExpandedKeys}
        onExpandedChange={onExpandedChange}
        onCellEdit={onCellEdit}
        {...(renderRowPanel || onRowOpen ? { onRowOpen: openRow } : {})}
        onFilterColumn={(id) =>
          collection.setFilter({
            ...state.filter,
            conditions: [
              ...state.filter.conditions,
              { id: `c${Date.now().toString(36)}`, field: id, operator: "contains", value: "" },
            ],
          })
        }
      />
    ));

  return (
    <CollectionPagerContext.Provider value>
      <IconRegistryProvider registry={COLLECTION_ICONS}>
        <div
          {...rest}
          ref={root}
          data-slot="data-view"
          data-layout={layout}
          role="region"
          aria-label={label}
          className={
            cn(
              "grid w-full min-w-0 content-start gap-3",
              isFullscreen && "overflow-auto bg-background p-4",
              className,
            ) ?? ""
          }
          style={{ minInlineSize: "min(36rem, calc(100vw - 6rem))", ...rest.style }}
        >
          <div role="toolbar" aria-label={t(K.toolbar, { label })} className="grid gap-2">
            {toolbar}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {chips ?? <span />}
              <span role="status" className="text-sm text-muted">
                {t(K.results, { count: collection.totalCount })}
              </span>
            </div>
          </div>
          {renderRowPanel ? (
            <CollectionRowPanel
              label={label}
              item={openItem}
              title={openItem ? cellTextOf(openItem, rowHeaderId) || openItem.id : ""}
              renderPanel={renderRowPanel}
              onClose={() => setOpenId(null)}
            >
              {body}
            </CollectionRowPanel>
          ) : (
            body
          )}
          <CollectionPager collection={collection} label={label} />
          {/* Virtualised views load the next page as their end comes into view; the others offer a button. */}
          {collection.paging === "infinite" &&
          (layout !== "table" || isTableAsCards) &&
          !isVirtualized &&
          collection.hasMore ? (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="secondary"
                isLoading={collection.isLoading}
                onPress={collection.loadMore}
              >
                {t(K.load_more)}
              </Button>
            </div>
          ) : null}
        </div>
      </IconRegistryProvider>
    </CollectionPagerContext.Provider>
  );
}
