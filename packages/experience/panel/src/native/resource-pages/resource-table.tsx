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
 *           `CollectionStore` adapter that writes nothing; a preset's fixed input goes with every read. The table sits
 *           in `PullToRefresh`'s scroll view, so its own list does not scroll. shortcut: a row's actions are its card's
 *           menu, not swipe actions (`SwipeableRow`); add swipes when a row needs a one-gesture action.
 * Runtime: react-native
 * Governing contract: ADR 0307 (rules 1, 2, 9, 11 and 12); ADR 0164 (native parity); ADR 0271 (decision 1); ADR 0505.
 */
import { useQuery } from "@stackra/clients/native";
import { Enum, SortDirection } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import type {
  CollectionColumn,
  CollectionState,
  CollectionStore,
  CollectionView,
} from "@stackra/ui/contracts";
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
import { listFiltersOf } from "#core/functions/list-filters-of.function";
import { listViewOf } from "#core/functions/list-view-of.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import { tableInput } from "#core/functions/table-input.function";
import { valueAt } from "#core/functions/value-at.function";
import type { ColumnNode } from "#core/types/column-node.type";
import type { ResourceTableProps } from "#native/resource-pages/resource-table.props";
import { ResourceValue } from "#native/resource-pages/resource-value";
import { SavedViewTabs } from "#native/saved-view-tabs/saved-view-tabs";

/** One row as the table holds it. */
type Row = Readonly<Record<string, unknown>> & { readonly id: string };

/** What the list query answers (`CrudService.table`'s page). */
interface Page {
  readonly items?: readonly Readonly<Record<string, unknown>>[];
  readonly nextCursor?: string;
  readonly hasMore?: boolean;
  readonly count?: { readonly value: number; readonly capped: boolean };
}

/** The slices of the engine's state the list query reads. */
type ListSlices = Pick<
  CollectionState,
  "search" | "filter" | "sort" | "cursor" | "pageSize" | "viewId"
>;

/** The id of the all-rows view. */
const ALL = "all";

/** The columns a table without a recording shows: the first row's own keys. */
const derived = (rows: readonly Row[]): ColumnNode[] =>
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
  const [rowsSeen, setRowsSeen] = useState<readonly Row[]>([]);
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
    for (const filter of filters) {
      const kind: Partial<CollectionColumn> =
        filter.kind === "trashed"
          ? {
              type: "choice",
              options: [
                { id: "with", label: t(PANEL_KEYS.panel.resources.trashed_with) },
                { id: "only", label: t(PANEL_KEYS.panel.resources.trashed_only) },
              ],
            }
          : filter.kind === "range"
            ? { type: "number" }
            : filter.kind === "dateRange"
              ? { type: "date" }
              : filter.kind === "isNull"
                ? { type: "boolean" }
                : filter.enum === undefined
                  ? { type: "text" }
                  : {
                      type: "choice",
                      options: Enum.values(filter.enum).map((code) => ({
                        id: String(code),
                        label: String(code),
                      })),
                    };
      const id = filter.kind === "trashed" ? "trashed" : filter.key;
      const at = all.findIndex((column) => column.id === id);
      const column = all[at];
      if (column !== undefined) all[at] = { ...column, ...kind, isFilterable: true };
      else
        all.push({
          id,
          label:
            filter.kind === "trashed"
              ? t(PANEL_KEYS.panel.resources.trashed)
              : t(resourceLabel(resourceKey, "filters", filter.key)),
          isHidden: true,
          ...kind,
        });
    }
    return all;
  }, [table, rowsSeen, resourceKey, t]);

  // The views (all rows, presets, saved), and per view what the quick filters cannot hold and a preset's fixed input.
  const [extras] = useState(
    () =>
      new Map<
        string,
        { rest: Readonly<Record<string, unknown>>; input?: Readonly<Record<string, unknown>> }
      >(),
  );
  const viewOf = (
    id: string,
    name: string,
    start: Parameters<typeof listViewOf>[2],
    fixed?: Readonly<Record<string, unknown>>,
  ): CollectionView => {
    const { view, rest } = listViewOf(id, name, start, table, columns);
    extras.set(id, { rest, ...(fixed === undefined ? {} : { input: fixed }) });
    return view;
  };
  const [fixedViews] = useState(() => [
    viewOf(ALL, t(PANEL_KEYS.panel.resources.all_views), undefined),
    ...presets.map((preset) =>
      viewOf(
        `preset:${preset.name}`,
        t(resourceLabel(resourceKey, "views", preset.name)),
        preset,
        preset.input,
      ),
    ),
  ]);
  const [store] = useState<CollectionStore | null>(() =>
    viewStore === undefined
      ? null
      : {
          // The views are read from the panel's store; the engine's own state is not kept between visits.
          get: async () => {
            const saved = await viewStore.list(resourceKey).catch(() => []);
            return {
              version: 1 as const,
              state: {},
              views: [...fixedViews, ...saved.map((view) => viewOf(view.id, view.name, view))],
              defaultViewId: null,
            };
          },
          // shortcut: saving a view from the tabs is not offered, so nothing is written back; add the ViewStore's save when the menu is.
          save: () => undefined,
        },
  );
  const start = fixedViews[0]?.state;
  const [slices, setSlices] = useState<ListSlices>({
    search: "",
    filter: start?.filter ?? { match: "all", conditions: [] },
    sort: start?.sort ?? [],
    cursor: null,
    pageSize,
    viewId: ALL,
  });
  const extra = extras.get(slices.viewId ?? ALL);
  const sent = listFiltersOf(slices.filter, columns);
  const first = slices.sort[0];
  const answer = useQuery(
    query,
    tableInput(
      table,
      {
        search: slices.search,
        filters: { ...extra?.rest, ...sent.values },
        sort:
          first === undefined
            ? null
            : {
                key: first.column,
                direction: first.direction === "ascending" ? SortDirection.Asc : SortDirection.Desc,
              },
        limit: slices.pageSize,
        ...(slices.cursor === null ? {} : { cursor: slices.cursor }),
      },
      extra?.input ?? NO_INPUT,
    ) as never,
    { keepPreviousData: true },
  );
  const page = (answer.data ?? {}) as Page;
  const rows: Row[] = (page.items ?? []).map((item, index) => ({
    ...item,
    id: String(item["id"] ?? index),
  }));
  if (table === undefined && rows.length > 0 && rowsSeen.length === 0) setRowsSeen(rows);

  const collection = useCollection<Row>({
    columns,
    items: rows,
    mode: "server",
    paging: "cursor",
    initialState: { ...slices },
    state: slices,
    onStateChange: ({ search, filter, sort, cursor, pageSize: size, viewId }) =>
      setSlices({ search, filter, sort, cursor, pageSize: size, viewId }),
    ...(store === null
      ? { views: fixedViews, store: null }
      : { store, collectionKey: `panel:${resourceKey}` }),
    isLoading: answer.isPending,
    nextCursor: page.hasMore === true ? (page.nextCursor ?? null) : null,
    ...(page.count === undefined ? {} : { totalCount: page.count.value }),
  });

  const count =
    page.count === undefined ? null : (
      <Text tone="muted">
        {t(
          page.count.capped
            ? PANEL_KEYS.panel.resources.count_capped
            : PANEL_KEYS.panel.resources.count,
          { count: page.count.value },
        )}
      </Text>
    );
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
              unappliedIds={sent.unsent}
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
