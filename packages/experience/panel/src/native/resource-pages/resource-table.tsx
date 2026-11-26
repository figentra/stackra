/**
 * Stackra file contract:
 * Purpose: the native `ResourceTable`, the List page's rows on `@stackra/ui`'s `useCollection` engine in server mode with
 *          cursor paging, as on the web: the recorded columns (or the row's own keys), sort, the filter bar with search,
 *          the cursor pager, row actions in each card's menu and the bulk bar, drawn with the native `DataTable` and
 *          `FilterBar`, the views as tabs (`SavedViewTabs`) when there are any, and pull to refresh.
 * Boundary: internal to the native resource pages. The engine holds the list state (search, filter, sort, cursor,
 *           selection, the view); this component reads one page with the native `useQuery` (refetched when the app
 *           returns) and hands it back. `tableInput` builds the closed input, so only declared sorts and filters are
 *           sent; the filter kinds and the unsent conditions follow the web table (`listFiltersOf`). The views are the
 *           all-rows view, the tree's presets and the `ViewStore`'s saved views (`listViewOf`), read through a
 *           `CollectionStore` adapter that writes nothing; a preset's fixed input goes with every read (the web table's
 *           platform-free `useResourceList`). The table sits in `PullToRefresh`'s scroll view, so its own list does not
 *           scroll. shortcut: a row's actions are its card's menu, not swipe actions (`SwipeableRow`); add swipes when a
 *           row needs a one-gesture action.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 1, 2, 9, 11 and 12); ADR 0164 (native parity); ADR 0271 (decision 1); ADR 0505.
 */
import { useQuery } from "@stackra/clients/native";
import { Enum } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import type { CollectionColumn } from "@stackra/ui/contracts";
import {
  DataTable,
  EmptyState,
  FilterBar,
  PullToRefresh,
  Text,
  useCollection,
} from "@stackra/ui/native";
import { useMemo, useState, type ReactElement } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { filterColumnKind } from "#core/functions/filter-column-kind.function";
import { placeFilterColumn } from "#core/functions/place-filter-column.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { tablePageOf } from "#core/functions/table-page-of.function";
import { valueAt } from "#core/functions/value-at.function";
import type { ColumnNode } from "#core/types/column-node.type";
import type { TableRow } from "#core/types/table-row.type";
import type { ResourceTableProps } from "#native/resource-pages/resource-table.props";
import { ResourceValue } from "#native/resource-pages/resource-value";
import { SavedViewTabs } from "#native/saved-view-tabs/saved-view-tabs";
import { useResourceList } from "#react/resource-pages/use-resource-list";

/** The columns a table without a recording shows: the first row's own keys. */
const derived = (rows: readonly TableRow[]): ColumnNode[] =>
  Object.keys(rows[0] ?? {}).map((key) => ({ kind: "value", key }));

/** No fixed input. */
const NO_INPUT: Readonly<Record<string, unknown>> = Object.freeze({});

/** No presets. */
const NO_PRESETS: readonly never[] = [];

/**
 * One list query's rows as a native data table.
 *
 * @example
 * <ResourceTable resourceKey="orders.order" label="Orders" query={ListOrdersQuery} pageSize={25} table={tree.table} />
 */
export function ResourceTable({
  resourceKey,
  label,
  query,
  table,
  pageSize,
  rowActions,
  bulkActions,
  emptyState,
  views: viewStore,
  presets = NO_PRESETS,
}: ResourceTableProps): ReactElement {
  const { t } = useTranslation();
  // The last page's rows name the columns of a table without a recording.
  const [rowsSeen, setRowsSeen] = useState<readonly TableRow[]>([]);
  const columns = useMemo<readonly CollectionColumn[]>(() => {
    const filters = table?.filters ?? [];
    const all: CollectionColumn[] = (table?.columns ?? derived(rowsSeen))
      .filter((column) => column.hidden !== true)
      .map((column) => ({
        id: column.key,
        label: t(resourceLabel(resourceKey, "columns", column.key)),
        isFilterable: false,
        ...(column.sortable === true ? { isSortable: true } : {}),
      }));
    for (const filter of filters)
      placeFilterColumn(
        all,
        filter.kind === "trashed" ? "trashed" : filter.key,
        () =>
          filter.kind === "trashed"
            ? t(PANEL_KEYS.panel.resources.trashed)
            : t(resourceLabel(resourceKey, "filters", filter.key)),
        filterColumnKind(
          filter,
          filter.kind === "trashed" || filter.enum === undefined
            ? undefined
            : Enum.values(filter.enum).map((code) => ({ id: String(code), label: String(code) })),
          t,
        ),
      );
    return all;
  }, [table, rowsSeen, resourceKey, t]);

  const list = useResourceList({
    resourceKey,
    table,
    pageSize,
    presets,
    views: viewStore,
    input: NO_INPUT,
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
  return (
    <PullToRefresh
      onRefresh={async () => {
        await answer.refetch();
      }}
      isRefreshing={answer.isFetching && !answer.isPending}
    >
      <DataTable
        label={label}
        collection={collection}
        scrollEnabled={false}
        renderCell={(row, column) => {
          const node = table?.columns.find((candidate) => candidate.key === column.id);
          const currency =
            node?.currency === undefined
              ? undefined
              : valueAt(row, node.currency.replace(/^record\./, ""));
          return (
            <ResourceValue
              resourceKey={resourceKey}
              path={column.id}
              kind={node?.kind ?? "value"}
              value={valueAt(row, column.id)}
              currency={currency}
              labels={node?.labels}
            />
          );
        }}
        filterBar={
          <>
            {tabs}
            <FilterBar
              collection={collection}
              searchLabel={t(PANEL_KEYS.panel.resources.search)}
              unappliedIds={list.unsent}
            />
            {count}
          </>
        }
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
    </PullToRefresh>
  );
}
