/**
 * Stackra file contract:
 * Purpose: `useResourceList(options)`, the list state of a resource table on either entry: the views (the all-rows view,
 *          the tree's presets and the `ViewStore`'s saved views, read through a `CollectionStore` adapter that writes
 *          nothing), the engine's search, filter, sort, cursor, page size and view, the closed input of the list query
 *          (`tableInput`: only declared sorts and filters, a preset's fixed input under the caller's own), the
 *          conditions the server cannot read (`unsent`), and per answered page the collection options and count words.
 * Boundary: platform-free: imports `react` and no UI kit (the collection options are typed by `@stackra/ui`'s web
 *           entry, a type only; both kits' `useCollection` is the same engine). The web and native tables run the query
 *           with their own `useQuery` and draw the engine with their own kit; the columns are each table's own.
 * Runtime: isomorphic (react)
 * Governing contract: ADR 0307 (rules 1, 2, 9, 11 and 12); ADR 0164; ADR 0271 (decision 1); ADR 0505.
 */
import { SortDirection } from "@stackra/contracts";
import { useTranslation } from "@stackra/i18n/react";
import type {
  CollectionColumn,
  CollectionState,
  CollectionStore,
  CollectionView,
} from "@stackra/ui/contracts";
import type { UseCollectionOptions } from "@stackra/ui/react";
import { useState } from "react";

import { PANEL_KEYS } from "#core/constants/panel-keys.constant";
import { listFiltersOf } from "#core/functions/list-filters-of.function";
import { listViewOf } from "#core/functions/list-view-of.function";
import { resourceLabel } from "#core/functions/resource-label.function";
import type { tablePageOf } from "#core/functions/table-page-of.function";
import { tableInput } from "#core/functions/table-input.function";
import type { ViewStore } from "#core/ports/view-store.port";
import type { TableNode } from "#core/types/table-node.type";
import type { TableRow } from "#core/types/table-row.type";
import type { ViewNode } from "#core/types/view-node.type";

/** The slices of the engine's state the list query reads. */
type ListSlices = Pick<
  CollectionState,
  "search" | "filter" | "sort" | "cursor" | "pageSize" | "viewId"
>;

/** The id of the all-rows view. */
const ALL = "all";

/**
 * The list state of one resource table.
 *
 * @example
 * const list = useResourceList({ resourceKey, table, pageSize, presets, views, input, columns });
 * const answer = useQuery(query, list.input as never, { keepPreviousData: true });
 * const collection = useCollection(list.collectionOf(tablePageOf(answer.data), answer.isPending));
 */
export function useResourceList({
  resourceKey,
  table,
  pageSize,
  presets,
  views: viewStore,
  input,
  columns,
}: {
  readonly resourceKey: string;
  readonly table: TableNode | undefined;
  readonly pageSize: number;
  readonly presets: readonly ViewNode[];
  readonly views: ViewStore | undefined;
  /** Fixed input (a relation's bound keys), above a preset's. */
  readonly input: Readonly<Record<string, unknown>>;
  readonly columns: readonly CollectionColumn[];
}): {
  readonly input: Readonly<Record<string, unknown>>;
  readonly unsent: readonly string[];
  readonly collectionOf: (
    page: ReturnType<typeof tablePageOf>,
    isLoading: boolean,
  ) => UseCollectionOptions<TableRow>;
  readonly countOf: (page: ReturnType<typeof tablePageOf>) => string | undefined;
} {
  const { t } = useTranslation();
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
  const fixed = extra?.input === undefined ? input : { ...extra.input, ...input };
  return {
    input: tableInput(
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
      fixed,
    ),
    unsent: sent.unsent,
    collectionOf: (page, isLoading) => ({
      columns,
      items: page.rows,
      mode: "server",
      paging: "cursor",
      initialState: { ...slices },
      state: slices,
      onStateChange: ({ search, filter, sort, cursor, pageSize: size, viewId }) =>
        setSlices({ search, filter, sort, cursor, pageSize: size, viewId }),
      ...(store === null
        ? { views: fixedViews, store: null }
        : { store, collectionKey: `panel:${resourceKey}` }),
      isLoading,
      nextCursor: page.nextCursor,
      ...(page.count === undefined ? {} : { totalCount: page.count.value }),
    }),
    countOf: (page) =>
      page.count === undefined
        ? undefined
        : t(
            page.count.capped
              ? PANEL_KEYS.panel.resources.count_capped
              : PANEL_KEYS.panel.resources.count,
            { count: page.count.value },
          ),
  };
}
