/**
 * Stackra file contract:
 * Purpose: proves `useCollection`: client mode searches, sorts and pages; column changes (move, rename, pin, hide,
 *          reset) show in the resolved columns; a controlled slice wins and every change is reported; a store keeps and
 *          restores the state and the views but not the selection; saved views apply, rename, become the default and
 *          delete; server mode hands the fetcher the query and drops a stale answer.
 * Boundary: the hook alone, through `renderHook`; the store is an in-memory one.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";

import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import type { CollectionSnapshot } from "#contracts/types/collection-snapshot.type";
import type { CollectionStore } from "#contracts/types/collection-store.type";
import { useCollection } from "#react/hooks/use-collection";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "customer", label: "Customer" },
  { id: "city", label: "City" },
  { id: "total", label: "Total", type: "number" },
];
const ROWS = Array.from({ length: 30 }, (_, index) => ({
  id: `o${index}`,
  customer: `Customer ${index}`,
  city: index % 2 === 0 ? "Riyadh" : "Jeddah",
  total: index * 10,
}));

/** A store in a map. */
function memoryStore(): CollectionStore & { readonly saved: Map<string, CollectionSnapshot> } {
  const saved = new Map<string, CollectionSnapshot>();
  return { saved, get: (key) => saved.get(key) ?? null, save: (key, value) => void saved.set(key, value) };
}

describe("useCollection", () => {
  it("searches, sorts and pages in client mode", () => {
    const { result } = renderHook(() =>
      useCollection({ columns: COLUMNS, items: ROWS, paging: "page", initialState: { pageSize: 10 } }),
    );
    expect(result.current.rows).toHaveLength(10);
    expect(result.current.pageCount).toBe(3);
    act(() => result.current.toggleSort("total"));
    act(() => result.current.toggleSort("total"));
    expect(result.current.rows[0]?.total).toBe(290);
    act(() => result.current.setPage(2));
    act(() => result.current.setSearch("jeddah"));
    expect(result.current.state.page).toBe(0);
    expect(result.current.totalCount).toBe(15);
    expect(result.current.isFiltered).toBe(true);
  });

  it("moves, renames, pins, hides and resets columns", () => {
    const { result } = renderHook(() => useCollection({ columns: COLUMNS, items: ROWS }));
    act(() => result.current.moveColumn("total", 0));
    act(() => result.current.updateColumn("city", { label: "المدينة", pin: "end", width: 180 }));
    act(() => result.current.updateColumn("customer", { isHidden: true }));
    expect(result.current.columns.map((column) => column.id)).toEqual(["total", "customer", "city"]);
    expect(result.current.columns[2]).toMatchObject({ label: "المدينة", pin: "end", width: 180 });
    // The first defined column is the row header, which never hides.
    expect(result.current.visibleColumns.map((column) => column.id)).toEqual(["total", "customer", "city"]);
    act(() => result.current.updateColumn("total", { isHidden: true }));
    expect(result.current.visibleColumns.map((column) => column.id)).toEqual(["customer", "city"]);
    act(() => result.current.resetColumns());
    expect(result.current.columns.map((column) => column.label)).toEqual(["Customer", "City", "Total"]);
  });

  it("reads a controlled slice and reports every change", () => {
    const onStateChange = vi.fn();
    const { result } = renderHook(() =>
      useCollection({ columns: COLUMNS, items: ROWS, state: { density: "compact" }, onStateChange }),
    );
    act(() => result.current.setDensity("roomy"));
    expect(result.current.state.density).toBe("compact");
    expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({ density: "roomy" }));
  });

  it("persists the state and views by key, never the selection", () => {
    const store = memoryStore();
    const first = renderHook(() =>
      useCollection({ columns: COLUMNS, items: ROWS, collectionKey: "orders", store }),
    );
    act(() => first.result.current.setGroupBy("city"));
    act(() => first.result.current.setSelection(["o1"]));
    let id = "";
    act(() => {
      id = first.result.current.saveViewAs("Riyadh");
    });
    act(() => first.result.current.setDefaultView(id));
    first.unmount();
    expect(store.saved.get("orders")?.state.groupBy).toBe("city");
    const second = renderHook(() =>
      useCollection({ columns: COLUMNS, items: ROWS, collectionKey: "orders", store }),
    );
    expect(second.result.current.state.groupBy).toBe("city");
    expect(second.result.current.state.selection).toEqual([]);
    expect(second.result.current.views.map((view) => view.label)).toEqual(["Riyadh"]);
    expect(second.result.current.defaultViewId).toBe(id);
    expect(second.result.current.groups?.map((group) => group.key)).toEqual(["Riyadh", "Jeddah"]);
  });

  it("applies, renames and deletes saved views", () => {
    const { result } = renderHook(() =>
      useCollection({
        columns: COLUMNS,
        items: ROWS,
        views: [{ id: "big", label: "Big", state: { sort: [{ column: "total", direction: "descending" }] } }],
        defaultViewId: "big",
      }),
    );
    expect(result.current.state.viewId).toBe("big");
    expect(result.current.rows[0]?.total).toBe(290);
    act(() => result.current.renameView("big", "Largest"));
    expect(result.current.views[0]?.label).toBe("Largest");
    act(() => result.current.deleteView("big"));
    expect(result.current.views).toEqual([]);
    expect(result.current.defaultViewId).toBeNull();
    expect(result.current.state.viewId).toBeNull();
  });

  it("hands a server fetcher the query and drops a stale answer", async () => {
    const calls: CollectionQuery[] = [];
    const resolvers: ((rows: typeof ROWS) => void)[] = [];
    const fetch = vi.fn(
      (query: CollectionQuery) =>
        new Promise<{ items: typeof ROWS; totalCount: number }>((resolve) => {
          calls.push(query);
          resolvers.push((rows) => resolve({ items: rows, totalCount: 99 }));
        }),
    );
    const { result } = renderHook(() =>
      useCollection({ columns: COLUMNS, mode: "server", paging: "page", fetch }),
    );
    expect(result.current.isLoading).toBe(true);
    act(() => result.current.setSearch("riy"));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]).toMatchObject({ search: "riy", page: 0, paging: "page" });
    await act(async () => {
      resolvers[0]?.(ROWS.slice(0, 1));
      resolvers[1]?.(ROWS.slice(0, 3));
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rows).toHaveLength(3);
    expect(result.current.totalCount).toBe(99);
  });
});
