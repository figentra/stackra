/**
 * Stackra file contract:
 * Purpose: `useCollection()`, the one headless engine of every data view (DataTable, DataGrid, List, Cards, DataView):
 *          the columns model (order, visibility, rename, width, pin, wrap), the multi-key sort, the and/or rule tree and
 *          the quick search, the group-by and footer aggregates, the selection ("all matching" too), the paging (page,
 *          cursor or infinite; `selected` says what a bulk action acts on: ids, or in server mode a descriptor of every
 *          matching row), the density, the layout and the saved views, in client mode (computed here) or server
 *          mode (a `CollectionQuery` out, rows and totals back), persisted by collection key through a `CollectionStore`.
 * Boundary: plain React (no DOM, no React Native), so both runtimes' components share it; the pure steps live in
 *           `core/functions` and are tested there. A slice in `options.state` is controlled. Persistence keeps the
 *           columns, sort, filter, search, group, totals, density, layout, page size and views, never the selection or
 *           the page. A server fetch a newer query replaces is aborted, and its late answer ignored. A new search,
 *           filter or sort goes back to the first page and clears the selection (ADR 0505).
 * Runtime: isomorphic
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0302 (decision 3); ADR 0313 (decisions 3 and 4);
 *          STA-1371.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import type { CollectionItem } from "#contracts/types/collection-item.type";
import type { CollectionController } from "#contracts/types/collection-controller.type";
import type { CollectionPage } from "#contracts/types/collection-page.type";
import type { CollectionSnapshot } from "#contracts/types/collection-snapshot.type";
import type { CollectionState } from "#contracts/types/collection-state.type";
import type { CollectionView } from "#contracts/types/collection-view.type";
import { applyCollection } from "#core/functions/apply-collection.function";
import { collectionAggregatesOf } from "#core/functions/collection-aggregates-of.function";
import { collectionGroupsOf } from "#core/functions/collection-groups-of.function";
import { collectionQueryOf } from "#core/functions/collection-query-of.function";
import { collectionSelectionOf } from "#core/functions/collection-selection-of.function";
import { collectionSnapshotOf } from "#core/functions/collection-snapshot-of.function";
import { createLocalCollectionStore } from "#core/functions/create-local-collection-store.function";
import { defaultCollectionStateOf } from "#core/functions/default-collection-state-of.function";
import { filterConditionCountOf } from "#core/functions/filter-condition-count-of.function";
import { moveColumnState } from "#core/functions/move-column-state.function";
import { nextCollectionSort } from "#core/functions/next-collection-sort.function";
import { resolveCollectionColumns } from "#core/functions/resolve-collection-columns.function";
import type { UseCollectionOptions } from "#react/hooks/use-collection-options.type";

/** The browser store every collection without its own shares. */
const LOCAL_STORE = createLocalCollectionStore();

/** No rows, one array for every render. */
const NO_ITEMS: readonly never[] = Object.freeze([]);

/** The slices a reset to the first page follows. */
const FIRST_PAGE = { page: 0, cursor: null } as const;

/** What a new query resets: the first page and the selection, whose rows the new query may no longer hold. */
const NEW_QUERY = {
  ...FIRST_PAGE,
  selection: [],
  isAllMatchingSelected: false,
  excludedKeys: [],
} as const;

/** A snapshot answered at once, or `undefined` for a promise or no store. */
function syncSnapshotOf(value: unknown): CollectionSnapshot | null | undefined {
  return value instanceof Promise ? undefined : (value as CollectionSnapshot | null);
}

/** A view's saved state: the collection state without its selection, page, cursor and view. */
const viewStateOf = (current: CollectionState): CollectionView["state"] => {
  const {
    selection: _s,
    isAllMatchingSelected: _a,
    excludedKeys: _e,
    page: _p,
    cursor: _c,
    viewId: _v,
    ...kept
  } = current;
  return kept;
};

/**
 * A collection's state, rows and changes.
 * @param options - the columns, rows, mode, state and persistence
 * @returns the controller every view and toolbar takes
 */
export function useCollection<TItem extends CollectionItem = CollectionItem>(
  options: UseCollectionOptions<TItem>,
): CollectionController<TItem> {
  const {
    columns: definitions,
    items = NO_ITEMS,
    mode = "client",
    paging = "none",
    initialState,
    state: controlled,
    onStateChange,
    collectionKey,
    source,
    totalCount: givenTotal,
    isLoading: givenLoading = false,
    nextCursor: givenNextCursor,
    locale = "en",
  } = options;
  const fetch = options.fetch ?? source?.fetch;
  const store =
    options.store === null || collectionKey === undefined ? null : (options.store ?? LOCAL_STORE);

  // The first state: the defaults, the app's start, then a saved state or the default view.
  const [boot] = useState(() => {
    const base = defaultCollectionStateOf(definitions, initialState);
    const saved = store && collectionKey ? syncSnapshotOf(store.get(collectionKey)) : null;
    const views = saved?.views ?? options.views ?? [];
    const defaultViewId = saved ? saved.defaultViewId : (options.defaultViewId ?? null);
    const view = saved ? undefined : views.find((candidate) => candidate.id === defaultViewId);
    const state: CollectionState = {
      ...base,
      ...saved?.state,
      ...(view ? { ...view.state, viewId: view.id } : {}),
    };
    return { base, state, views, defaultViewId, isLoaded: saved !== undefined || !store };
  });
  const [own, setOwn] = useState<CollectionState>(boot.state);
  const [views, setViews] = useState<readonly CollectionView[]>(boot.views);
  const [defaultViewId, setDefaultViewId] = useState<string | null>(boot.defaultViewId);
  const [isLoaded, setLoaded] = useState(boot.isLoaded);

  // An async store answers after the first render.
  useEffect(() => {
    if (isLoaded || !store || !collectionKey) return;
    let isCurrent = true;
    void Promise.resolve(store.get(collectionKey)).then((saved) => {
      if (!isCurrent) return;
      if (saved) {
        setOwn((current) => ({ ...current, ...saved.state }));
        setViews(saved.views);
        setDefaultViewId(saved.defaultViewId);
      }
      setLoaded(true);
    });
    return () => {
      isCurrent = false;
    };
  }, [isLoaded, store, collectionKey]);

  const state: CollectionState = useMemo(
    () => ({ ...own, ...controlled }),
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: the controlled slices are compared by value
    [own, JSON.stringify(controlled ?? {})],
  );
  const latest = useRef(state);
  latest.current = state;
  // The cursor of each page shown so far (`cursor` paging), so Previous goes back to the cursor it came from.
  const cursors = useRef<(string | null)[]>([null]);

  const commit = (next: CollectionState) => {
    latest.current = next;
    setOwn(next);
    onStateChange?.(next);
  };
  const update = (patch: Partial<CollectionState>) => commit({ ...latest.current, ...patch });

  // Persist what the user arranged, once the saved state is known (so it is never overwritten by the defaults).
  const snapshot = JSON.stringify(collectionSnapshotOf(state, views, defaultViewId));
  useEffect(() => {
    if (!isLoaded || !store || !collectionKey) return;
    void store.save(collectionKey, JSON.parse(snapshot) as CollectionSnapshot);
  }, [isLoaded, store, collectionKey, snapshot]);

  const columns = useMemo(
    () => resolveCollectionColumns(definitions, state.columns),
    [definitions, state.columns],
  );
  const visibleColumns = useMemo(() => columns.filter((column) => !column.isHidden), [columns]);
  const query = useMemo(() => collectionQueryOf(state, columns, paging), [state, columns, paging]);

  // Server mode with a fetcher: one fetch per query, the older one aborted; `infinite` appends the next page.
  const [fetched, setFetched] = useState<CollectionPage<TItem> | null>(null);
  const [fetchState, setFetchState] = useState<{ isLoading: boolean; error: unknown }>({
    isLoading: mode === "server" && fetch !== undefined,
    error: undefined,
  });
  const [refreshCount, setRefreshCount] = useState(0);
  const queryKey = JSON.stringify(query);
  // The last query answered, without its page and cursor, and its page: the next page of the same query is appended.
  const previous = useRef<{ readonly base: string; readonly page: number } | null>(null);
  useEffect(() => {
    if (mode !== "server" || fetch === undefined) return;
    const controller = new AbortController();
    const base = JSON.stringify({ ...query, page: 0, cursor: null });
    const isAppend =
      paging === "infinite" &&
      query.page > 0 &&
      previous.current?.base === base &&
      previous.current.page === query.page - 1;
    setFetchState({ isLoading: true, error: undefined });
    fetch(query, controller.signal).then(
      (page) => {
        if (controller.signal.aborted) return;
        // Remembered once answered, so a fetch aborted and made again (a re-run effect) still appends.
        previous.current = { base, page: query.page };
        setFetched((current) =>
          isAppend && current ? { ...page, items: [...current.items, ...page.items] } : page,
        );
        setFetchState({ isLoading: false, error: undefined });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        setFetchState({ isLoading: false, error });
      },
    );
    return () => controller.abort();
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reason: the query is compared by its JSON
  }, [mode, fetch, queryKey, refreshCount]);

  const applied = useMemo(
    () => (mode === "client" ? applyCollection(items, state, columns, paging, locale) : null),
    [mode, items, state, columns, paging, locale],
  );
  const rows = applied ? applied.rows : (fetched?.items ?? items);
  const nextCursor = fetched ? fetched.nextCursor : givenNextCursor;
  const matched = applied ? applied.matched : rows;
  const totalCount = applied
    ? applied.matched.length
    : (fetched?.totalCount ?? givenTotal ?? rows.length);
  const pageCount = applied
    ? applied.pageCount
    : Math.max(1, Math.ceil(totalCount / Math.max(1, state.pageSize)));
  const hasMore = applied
    ? applied.hasMore
    : paging === "page"
      ? state.page < pageCount - 1
      : nextCursor
        ? true
        : nextCursor === null
          ? false
          : rows.length < totalCount;
  const aggregates = useMemo(
    () => fetched?.aggregates ?? collectionAggregatesOf(matched, state.aggregates),
    [fetched, matched, state.aggregates],
  );
  const groups = useMemo(
    () => (state.groupBy ? collectionGroupsOf(rows, state.groupBy, state.aggregates) : null),
    [rows, state.groupBy, state.aggregates],
  );

  const changeViews = (next: readonly CollectionView[], nextDefault = defaultViewId) => {
    setViews(next);
    setDefaultViewId(nextDefault);
  };

  return {
    collectionKey,
    mode,
    paging,
    state,
    columns,
    visibleColumns,
    rows,
    groups,
    totalCount,
    pageCount,
    hasMore,
    aggregates,
    selected: collectionSelectionOf(state, mode, matched, totalCount),
    isLoading: fetch ? fetchState.isLoading : givenLoading,
    error: fetchState.error,
    query,
    isFiltered: state.search.trim() !== "" || filterConditionCountOf(state.filter) > 0,
    views,
    defaultViewId,
    update,
    setSearch: (search) => update({ search, ...NEW_QUERY }),
    setFilter: (filter) => update({ filter, ...NEW_QUERY }),
    setSort: (sort) => update({ sort, ...NEW_QUERY }),
    toggleSort: (columnId, isAdditive) =>
      update({
        sort: nextCollectionSort(latest.current.sort, columnId, isAdditive),
        ...NEW_QUERY,
      }),
    setGroupBy: (groupBy) => update({ groupBy }),
    setAggregate: (columnId, kind) => {
      const { [columnId]: _dropped, ...rest } = latest.current.aggregates;
      update({ aggregates: kind ? { ...rest, [columnId]: kind } : rest });
    },
    moveColumn: (columnId, toIndex) => {
      // The display order is the resolved one (pins first), so the move is made on it.
      const ordered = resolveCollectionColumns(definitions, latest.current.columns).map(
        (column) =>
          latest.current.columns.find((entry) => entry.id === column.id) ?? { id: column.id },
      );
      update({ columns: moveColumnState(ordered, columnId, toIndex) });
    },
    reorderColumns: (columnIds) => {
      const byId = new Map(latest.current.columns.map((entry) => [entry.id, entry]));
      update({ columns: columnIds.map((id) => byId.get(id) ?? { id }) });
    },
    updateColumn: (columnId, patch) => {
      const known = latest.current.columns.some((entry) => entry.id === columnId);
      const next = known
        ? latest.current.columns.map((entry) =>
            entry.id === columnId ? { ...entry, ...patch } : entry,
          )
        : [...latest.current.columns, { id: columnId, ...patch }];
      update({ columns: next });
    },
    resetColumns: () => update({ columns: boot.base.columns }),
    setDensity: (density) => update({ density }),
    setLayout: (layout) => update({ layout }),
    setSelection: (selection) =>
      update({ selection, isAllMatchingSelected: false, excludedKeys: [] }),
    setAllMatchingSelected: (isAllMatchingSelected) =>
      update({ isAllMatchingSelected, excludedKeys: [] }),
    setExcludedKeys: (excludedKeys) => update({ excludedKeys }),
    setPage: (page) => {
      const next = Math.max(0, page);
      update(
        paging === "cursor"
          ? { page: next, cursor: cursors.current[next] ?? null }
          : { page: next },
      );
    },
    setPageSize: (pageSize) => update({ pageSize, ...FIRST_PAGE }),
    loadMore: () => {
      const page = latest.current.page + 1;
      const cursor = nextCursor ?? latest.current.cursor;
      cursors.current[page] = cursor;
      update({ page, cursor });
    },
    applyView: (viewId) => {
      const view = views.find((candidate) => candidate.id === viewId);
      if (!view) return;
      commit({
        ...boot.base,
        ...view.state,
        selection: [],
        isAllMatchingSelected: false,
        excludedKeys: [],
        ...FIRST_PAGE,
        viewId,
      });
    },
    saveViewAs: (label) => {
      const id = `view-${Date.now().toString(36)}-${views.length}`;
      changeViews([...views, { id, label, state: viewStateOf(latest.current) }]);
      update({ viewId: id });
      return id;
    },
    saveView: (viewId) =>
      changeViews(
        views.map((view) =>
          view.id === viewId ? { ...view, state: viewStateOf(latest.current) } : view,
        ),
      ),
    renameView: (viewId, label) =>
      changeViews(views.map((view) => (view.id === viewId ? { ...view, label } : view))),
    deleteView: (viewId) => {
      changeViews(
        views.filter((view) => view.id !== viewId),
        defaultViewId === viewId ? null : defaultViewId,
      );
      if (latest.current.viewId === viewId) update({ viewId: null });
    },
    setDefaultView: (viewId) => changeViews(views, viewId),
    reset: () => commit(boot.base),
    refresh: () => setRefreshCount((count) => count + 1),
  };
}
