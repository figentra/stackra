/**
 * Stackra file contract:
 * Purpose: proves the rest of `useCollection`: an async store restores state and views after the first render; the
 *          setters for filter, sort, aggregates, layout, page size, select-all and reorder reach the state; saving an
 *          existing view stores the current state; applying an unknown view does nothing; reset restores the start;
 *          server mode with given rows and total pages by count, appends an infinite page, keeps a fetch error and
 *          refreshes. Also proves `usePaginationState`: clamps, reports, resizes back to page one.
 * Boundary: the hooks alone, through `renderHook`; the stores and fetchers are in-memory.
 * Runtime: browser
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import type { CollectionSnapshot } from "#contracts/types/collection-snapshot.type";
import { useCollection } from "#react/hooks/use-collection";
import { usePaginationState } from "#react/hooks/use-pagination-state";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer" },
  { id: "total", label: "Total", type: "number" },
];
const ROWS = Array.from({ length: 6 }, (_, index) => ({
  id: `o${index}`,
  customer: `C${index}`,
  total: index,
}));

describe("useCollection (more)", () => {
  it("restores state and views from an async store after the first render", async () => {
    const snapshot = {
      state: { search: "C1" },
      views: [{ id: "v", label: "Mine", state: {} }],
      defaultViewId: "v",
    } as unknown as CollectionSnapshot;
    const save = vi.fn();
    const { result } = renderHook(() =>
      useCollection({
        columns: COLUMNS,
        items: ROWS,
        collectionKey: "k",
        store: { get: () => Promise.resolve(snapshot), save },
      }),
    );
    expect(result.current.state.search).toBe("");
    expect(save).not.toHaveBeenCalled();
    await waitFor(() => expect(result.current.state.search).toBe("C1"));
    expect(result.current.views.map((view) => view.label)).toEqual(["Mine"]);
    expect(result.current.defaultViewId).toBe("v");
    await waitFor(() => expect(save).toHaveBeenCalled());
  });

  it("starts fresh when an async store has nothing, and keeps nothing without a key", async () => {
    const save = vi.fn();
    const { result } = renderHook(() =>
      useCollection({
        columns: COLUMNS,
        items: ROWS,
        collectionKey: "k",
        store: { get: () => Promise.resolve(null), save },
      }),
    );
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(result.current.views).toEqual([]);
    const keyless = renderHook(() => useCollection({ columns: COLUMNS, items: ROWS, store: null }));
    expect(keyless.result.current.collectionKey).toBeUndefined();
  });

  it("sets filter, sort, aggregates, layout, page size, select-all and order, then resets", () => {
    const { result } = renderHook(() =>
      useCollection({ columns: COLUMNS, items: ROWS, paging: "page" }),
    );
    act(() =>
      result.current.setFilter({
        match: "all",
        conditions: [{ id: "a", field: "customer", operator: "equals", value: "C2" }],
      }),
    );
    expect(result.current.rows.map((row) => row.id)).toEqual(["o2"]);
    expect(result.current.isFiltered).toBe(true);
    act(() => result.current.setFilter({ match: "all", conditions: [] }));
    act(() => result.current.setSort([{ column: "total", direction: "descending" }]));
    expect(result.current.rows[0]?.id).toBe("o5");
    act(() => result.current.setAggregate("total", "sum"));
    expect(result.current.state.aggregates).toEqual({ total: "sum" });
    act(() => result.current.setAggregate("total", null));
    expect(result.current.state.aggregates).toEqual({});
    act(() => result.current.setLayout("cards"));
    act(() => result.current.setPageSize(2));
    expect(result.current.pageCount).toBe(3);
    act(() => result.current.setPage(-4));
    expect(result.current.state.page).toBe(0);
    act(() => result.current.setSelection(["o1"]));
    act(() => result.current.setAllMatchingSelected(true));
    expect(result.current.state.isAllMatchingSelected).toBe(true);
    act(() => result.current.reorderColumns(["total", "customer"]));
    expect(result.current.columns.map((column) => column.id)).toEqual(["total", "customer"]);
    act(() => result.current.reset());
    expect(result.current.state.layout).toBe("table");
    expect(result.current.columns.map((column) => column.id)).toEqual(["customer", "total"]);
  });

  it("saves the current state into an existing view and ignores an unknown one", () => {
    const { result } = renderHook(() =>
      useCollection({ columns: COLUMNS, items: ROWS, views: [{ id: "v", label: "V", state: {} }] }),
    );
    act(() => result.current.applyView("v"));
    act(() => result.current.setSearch("C3"));
    act(() => result.current.saveView("v"));
    expect(result.current.views[0]?.state.search).toBe("C3");
    expect(result.current.views[0]?.state).not.toHaveProperty("selection");
    act(() => result.current.applyView("nope"));
    expect(result.current.state.viewId).toBe("v");
    act(() => result.current.deleteView("other"));
    expect(result.current.state.viewId).toBe("v");
  });

  it("pages server rows by the given total without a fetcher", () => {
    const { result } = renderHook(() =>
      useCollection({
        columns: COLUMNS,
        items: ROWS.slice(0, 2),
        mode: "server",
        paging: "page",
        totalCount: 9,
        isLoading: true,
        initialState: { pageSize: 2 },
      }),
    );
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.pageCount).toBe(5);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.isLoading).toBe(true);
    const infinite = renderHook(() =>
      useCollection({
        columns: COLUMNS,
        items: ROWS.slice(0, 2),
        mode: "server",
        paging: "infinite",
        totalCount: 2,
      }),
    );
    expect(infinite.result.current.hasMore).toBe(false);
  });

  it("appends the next infinite page, keeps an error and refreshes", async () => {
    const calls: CollectionQuery[] = [];
    let fail = false;
    const fetch = vi.fn((query: CollectionQuery) => {
      calls.push(query);
      if (fail) return Promise.reject(new Error("down"));
      return Promise.resolve({
        items: ROWS.slice(query.page * 2, query.page * 2 + 2),
        totalCount: 6,
        aggregates: { total: 1 },
      });
    });
    const { result } = renderHook(() =>
      useCollection({
        columns: COLUMNS,
        mode: "server",
        paging: "infinite",
        fetch,
        initialState: { pageSize: 2 },
      }),
    );
    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.aggregates).toEqual({ total: 1 });
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.rows).toHaveLength(4));
    expect(result.current.hasMore).toBe(true);
    fail = true;
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.isLoading).toBe(false);
    expect(calls.length).toBe(3);
  });
});

describe("useCollection (cursor paging)", () => {
  it("appends the next infinite page when the server pages by cursor", async () => {
    const calls: CollectionQuery[] = [];
    const fetch = vi.fn((query: CollectionQuery) => {
      calls.push(query);
      const at = query.cursor === null ? 0 : Number(query.cursor);
      return Promise.resolve({
        items: ROWS.slice(at, at + 2),
        totalCount: 6,
        ...(at + 2 < 6 ? { nextCursor: String(at + 2) } : {}),
      });
    });
    const { result } = renderHook(() =>
      useCollection({
        columns: COLUMNS,
        mode: "server",
        paging: "infinite",
        fetch,
        initialState: { pageSize: 2 },
      }),
    );
    await waitFor(() => expect(result.current.rows).toHaveLength(2));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.rows).toHaveLength(4));
    expect(calls.at(-1)?.cursor).toBe("2");
    expect(result.current.rows.map((row) => row.id)).toEqual(["o0", "o1", "o2", "o3"]);
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.rows).toHaveLength(6));
    expect(result.current.hasMore).toBe(false);
  });
});

describe("usePaginationState", () => {
  it("clamps and reports pages, ignores the current page, and resizes back to page one", () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { result } = renderHook(() =>
      usePaginationState({ total: 25, pageSizes: [10, 20], onPageChange, onPageSizeChange }),
    );
    expect(result.current).toMatchObject({ current: 1, size: 10, pageCount: 3, from: 1, to: 10 });
    act(() => result.current.go(1));
    expect(onPageChange).not.toHaveBeenCalled();
    act(() => result.current.go(9));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(result.current).toMatchObject({ current: 3, from: 21, to: 25 });
    act(() => result.current.resize(20));
    expect(onPageSizeChange).toHaveBeenLastCalledWith(20);
    expect(onPageChange).toHaveBeenLastCalledWith(1);
    expect(result.current).toMatchObject({ current: 1, size: 20, pageCount: 2 });
  });

  it("follows a controlled page and size and shows nothing for no rows", () => {
    const onPageChange = vi.fn();
    const { result } = renderHook(() =>
      usePaginationState({ total: 0, page: 4, pageSize: 0, onPageChange }),
    );
    expect(result.current).toMatchObject({ current: 1, size: 1, from: 0, to: 0 });
    const controlled = renderHook(() =>
      usePaginationState({ total: 50, page: 2, pageSize: 10, onPageChange }),
    );
    act(() => controlled.result.current.go(3));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
    expect(controlled.result.current.current).toBe(2);
    act(() => controlled.result.current.resize(25));
    expect(controlled.result.current.size).toBe(10);
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });
});
