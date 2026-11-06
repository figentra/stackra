/**
 * Stackra file contract:
 * Purpose: `ResourceTable`, the data table of a list query on `@stackra/ui`'s `useCollection` engine in server mode with
 *          cursor paging: the recorded columns (or the row's own keys), sort, the filter bar with search, the cursor
 *          pager, row actions and the bulk bar, drawn with `DataTable` and `FilterBar`, and the views as tabs
 *          (`SavedViewTabs`) when there are any. The List page and every relation manager draw it.
 * Boundary: internal to the resource pages. The engine holds the list state (search, filter, sort, cursor, selection,
 *           the view); this component reads one page with `useQuery` and hands it back (`items`, `totalCount`,
 *           `nextCursor`, `isLoading`). `tableInput` builds the closed input, so only declared sorts and filters are
 *           sent; the engine's columns carry each declared filter's kind (range as a number, a date range as days,
 *           is-null as yes or no, an enum as a choice, the trashed filter as with or only, the rest as text), and
 *           `listFiltersOf` reads their values back, and names the conditions the server cannot read, whose chips the
 *           filter bar draws as warnings (`unappliedIds`). A cell shows an enum code by its label (`ResourceValue`); a
 *           principal column shows the principal's name. The views are the all-rows view, the tree's presets and the
 *           `ViewStore`'s saved views (`listViewOf`), read through a `CollectionStore` adapter that writes nothing; a
 *           preset's fixed input goes with every read under the user's state, below a relation's bound keys. A page
 *           that carries a count shows it beside the filter bar, capped as "10,000+" (`CrudService.table`'s
 *           `TableCount`). The recorded look reaches the kit: each column's header words, alignment, widths, pin, wrap,
 *           resizing, row header, start hidden (`hidden` keeps the column choosable), hideable, inline edit (through
 *           `onCellEdit`), aggregate and cell kind (`ResourceCell`); each filter's words, control, quick filter settings
 *           and choices (an enum's codes by their labels); the table's sticky header, column tools and resize handles,
 *           the search box's words, the filtered empty state (its own words; the filter bar keeps the way to clear), the
 *           row menu's hover buttons and the bulk bar's name.
 *           Pinned filters, range presets and saving a view are recorded but not drawn yet (the kit has no slot).
 *           The list state (views, slices, query input, collection options) is `useResourceList`, shared with native.
 * Runtime: browser
 * Governing contract: ADR 0307 (rules 1, 2, 9, 11 and 12); ADR 0164; ADR 0271 (decision 1); ADR 0505 (one data
 *          family: the panel on the engine); reporting gaps 5 and 7; the SDUI catalogue cases `tableColumns`,
 *          `tableFilters`, `emptyStates`, `rowActions` and `bulkActions` (STA-1981).
 */
import { useQuery } from "@stackra/clients/react";
import { Enum } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import type { CollectionColumn } from "@stackra/ui/contracts";
import { DataTable, EmptyState, FilterBar, Text, useCollection } from "@stackra/ui/react";
import { useMemo, useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import type { FilterKind } from "#core/enums/filter-kind.enum";
import { filterColumnKind } from "#core/functions/filter-column-kind.function";
import { placeFilterColumn } from "#core/functions/place-filter-column.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { specText } from "#core/functions/spec-text.function";
import { tablePageOf } from "#core/functions/table-page-of.function";
import type { ColumnNode } from "#core/types/column-node.type";
import type { TableRow } from "#core/types/table-row.type";
import { ResourceCell } from "#react/resource-pages/resource-cell";
import type { ResourceTableProps } from "#react/resource-pages/resource-table.props";
import { useEnumLabel } from "#react/resource-pages/use-enum-label";
import { useResourceList } from "#react/resource-pages/use-resource-list";
import { SavedViewTabs } from "#react/saved-view-tabs/saved-view-tabs";

/** The columns a table without a recording shows: the first row's own scalar keys. */
const derived = (rows: readonly TableRow[]): ColumnNode[] =>
  Object.keys(rows[0] ?? {}).map((key) => ({ kind: "value", key }));

/** One empty input for every render, so a default never changes identity. */
const NO_INPUT: Readonly<Record<string, unknown>> = {};

/** No presets. */
const NO_PRESETS: readonly never[] = [];

/** The engine column type each filter control draws as. */
const CONTROL_TYPE: Readonly<Record<FilterKind, NonNullable<CollectionColumn["type"]>>> = {
  text: "text",
  number: "number",
  date: "date",
  "date-range": "date",
  boolean: "boolean",
  choice: "choice",
  "multi-choice": "choice",
  principal: "text",
  "time-range": "date",
};

/** A recorded column's look as the engine takes it; a width given as text is left to the table. */
const columnLook = (column: ColumnNode): Partial<Omit<CollectionColumn, "id" | "label">> => {
  const look: {
    -readonly [K in Exclude<keyof CollectionColumn, "id" | "label">]?: CollectionColumn[K];
  } = {};
  if (column.align !== undefined) look.align = column.align;
  if (typeof column.width === "number") look.width = column.width;
  if (column.minWidth !== undefined) look.minWidth = column.minWidth;
  if (column.maxWidth !== undefined) look.maxWidth = column.maxWidth;
  if (column.pin !== undefined) look.pin = column.pin;
  if (column.wrap !== undefined) look.wrap = column.wrap;
  if (column.isResizable !== undefined) look.isResizable = column.isResizable;
  if (column.isRowHeader !== undefined) look.isRowHeader = column.isRowHeader;
  if (column.hidden === true) look.isHidden = true;
  if (column.isHideable !== undefined) look.isHideable = column.isHideable;
  if (column.isEditable !== undefined) look.isEditable = column.isEditable;
  if (column.aggregate !== undefined) look.aggregate = column.aggregate;
  return look;
};

/**
 * One list query's rows as a data table.
 *
 * @example
 * <ResourceTable resourceKey="orders.order" label="Orders" query={ListOrdersQuery} pageSize={25} table={tree.table} />
 */
export function ResourceTable({
  resourceKey,
  label,
  query,
  input = NO_INPUT,
  table,
  pageSize,
  searchable = true,
  rowActions,
  bulkActions,
  emptyState,
  views: viewStore,
  presets = NO_PRESETS,
  onCellEdit,
}: ResourceTableProps): ReactElement {
  const { t } = useTranslation();
  const enumLabel = useEnumLabel();
  // The last page's rows name the columns of a table without a recording.
  const [rowsSeen, setRowsSeen] = useState<readonly TableRow[]>([]);
  const columns = useMemo<readonly CollectionColumn[]>(() => {
    const filters = table?.filters ?? [];
    // A hidden column starts hidden but stays choosable in the column picker.
    const shown: CollectionColumn[] = (table?.columns ?? derived(rowsSeen)).map((column) => ({
      id: column.key,
      label:
        column.label === undefined
          ? t(resourceLabel(resourceKey, "columns", column.key))
          : specText(column.label, t),
      isFilterable: false,
      ...(column.sortable === true ? { isSortable: true } : {}),
      ...columnLook(column),
    }));
    const all = [...shown];
    for (const filter of filters) {
      const choices =
        filter.kind === "trashed"
          ? undefined
          : (filter.choices?.map((choice) => ({
              id: choice.value,
              label: specText(choice.label, t),
            })) ??
            (filter.enum === undefined
              ? undefined
              : Enum.values(filter.enum).map((code) => ({
                  id: String(code),
                  label: enumLabel(resourceKey, filter.key, String(code)) ?? String(code),
                }))));
      const settings =
        filter.kind === "trashed"
          ? {}
          : {
              filter: {
                ...(filter.placeholder === undefined
                  ? {}
                  : { placeholder: specText(filter.placeholder, t) }),
                ...(filter.isDisabled === undefined ? {} : { isDisabled: filter.isDisabled }),
                ...(filter.step === undefined ? {} : { step: filter.step }),
                ...(filter.trueLabel === undefined
                  ? {}
                  : { trueLabel: specText(filter.trueLabel, t) }),
                ...(filter.falseLabel === undefined
                  ? {}
                  : { falseLabel: specText(filter.falseLabel, t) }),
              },
            };
      const controlled: Partial<CollectionColumn> | undefined =
        filter.kind === "trashed" || filter.control === undefined
          ? undefined
          : {
              type: CONTROL_TYPE[filter.control],
              ...(CONTROL_TYPE[filter.control] === "choice" && choices !== undefined
                ? { options: choices }
                : {}),
            };
      placeFilterColumn(
        all,
        filter.kind === "trashed" ? "trashed" : filter.key,
        () =>
          filter.kind === "trashed"
            ? t(PANEL_KEYS.panel.resources.trashed)
            : filter.label === undefined
              ? t(resourceLabel(resourceKey, "filters", filter.key))
              : specText(filter.label, t),
        { ...(controlled ?? filterColumnKind(filter, choices, t)), ...settings },
      );
    }
    return all;
  }, [table, rowsSeen, resourceKey, t, enumLabel]);

  const list = useResourceList({
    resourceKey,
    table,
    pageSize,
    presets,
    views: viewStore,
    input,
    columns,
  });
  const answer = useQuery(query, list.input as never, { keepPreviousData: true });
  const page = tablePageOf(answer.data);
  if (table === undefined && page.rows.length > 0 && rowsSeen.length === 0) setRowsSeen(page.rows);
  const collection = useCollection<TableRow>(list.collectionOf(page, answer.isPending));
  const countText = list.countOf(page);
  const count = countText === undefined ? null : <Text tone="muted">{countText}</Text>;
  const tabs =
    collection.views.length > 1 ? (
      <SavedViewTabs collection={collection} label={t(PANEL_KEYS.panel.resources.saved_views)} />
    ) : null;
  const hasFilters = columns.some((column) => column.isFilterable !== false);
  const filterBar = (
    <>
      {tabs}
      {searchable || hasFilters ? (
        <FilterBar
          collection={collection}
          searchLabel={
            table?.searchLabel === undefined
              ? t(PANEL_KEYS.panel.resources.search)
              : specText(table.searchLabel, t)
          }
          searchPlaceholder={
            table?.searchPlaceholder === undefined
              ? undefined
              : specText(table.searchPlaceholder, t)
          }
          unappliedIds={list.unsent}
        />
      ) : null}
      {count}
    </>
  );
  return (
    <DataTable
      label={label}
      collection={collection}
      renderCell={(row, column) => (
        <ResourceCell
          resourceKey={resourceKey}
          columnId={column.id}
          node={table?.columns.find((candidate) => candidate.key === column.id)}
          row={row}
        />
      )}
      isStickyHeader={table?.isStickyHeader}
      hasColumnTools={table?.hasColumnTools}
      isColumnResizable={table?.isColumnResizable}
      hasHoverActions={table?.rowActions?.hasHoverActions}
      {...(table?.bulkActions?.label === undefined
        ? {}
        : { bulkActionsLabel: specText(table.bulkActions.label, t) })}
      {...(onCellEdit === undefined ? {} : { onCellEdit })}
      {...(table?.empty?.filtered === undefined
        ? {}
        : {
            filteredEmptyState: (
              <EmptyState
                reason="no-results"
                title={specText(table.empty.filtered.title, t)}
                description={
                  table.empty.filtered.description === undefined
                    ? undefined
                    : specText(table.empty.filtered.description, t)
                }
              />
            ),
          })}
      {...(tabs === null && count === null && !searchable && !hasFilters ? {} : { filterBar })}
      {...(rowActions === undefined ? {} : { rowActions })}
      {...(bulkActions === undefined
        ? {}
        : {
            selectionMode: "multiple" as const,
            bulkActions: bulkActions(collection.state.selection),
          })}
      loadingLabel={label}
      {...(answer.error === null
        ? {}
        : {
            error: answer.error,
            onRetry: () => void answer.refetch(),
            retryLabel: t(PANEL_KEYS.panel.resources.retry),
          })}
      emptyState={emptyState ?? <EmptyState title={t(PANEL_KEYS.panel.resources.empty)} />}
    />
  );
}
