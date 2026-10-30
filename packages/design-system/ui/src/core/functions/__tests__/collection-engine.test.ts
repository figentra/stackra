/**
 * Stackra file contract:
 * Purpose: proves the collection engine's pure steps: the multi-key sort (numbers, numeric text, empties last, stable),
 *          the and/or rule tree with nested groups, the quick search (Arabic folding), the group-by with aggregates,
 *          the footer aggregates, the column ops (resolve, pin order, rename, hide, move), the paging, the server query
 *          object and the localStorage driver.
 * Boundary: the pure functions alone.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29); ADR 0022 (test placement); STA-1371.
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionSnapshot } from "#contracts/types/collection-snapshot.type";
import { applyCollection } from "#core/functions/apply-collection.function";
import { collectionAggregatesOf } from "#core/functions/collection-aggregates-of.function";
import { collectionFilterMatches } from "#core/functions/collection-filter-matches.function";
import { collectionGroupsOf } from "#core/functions/collection-groups-of.function";
import { collectionQueryOf } from "#core/functions/collection-query-of.function";
import { collectionSearchMatches } from "#core/functions/collection-search-matches.function";
import { collectionSnapshotOf } from "#core/functions/collection-snapshot-of.function";
import { createLocalCollectionStore } from "#core/functions/create-local-collection-store.function";
import { defaultCollectionStateOf } from "#core/functions/default-collection-state-of.function";
import { filterConditionCountOf } from "#core/functions/filter-condition-count-of.function";
import { moveColumnState } from "#core/functions/move-column-state.function";
import { nextCollectionSort } from "#core/functions/next-collection-sort.function";
import { resolveCollectionColumns } from "#core/functions/resolve-collection-columns.function";
import { sortCollectionItems } from "#core/functions/sort-collection-items.function";

const ROWS = [
  { id: "a", order: "#10", city: "Riyadh", total: 300 },
  { id: "b", order: "#9", city: "Jeddah", total: 120 },
  { id: "c", order: "#11", city: "Riyadh", total: null },
  { id: "d", order: "#2", city: "الرياض", total: 50 },
];

const COLUMNS: readonly CollectionColumn[] = [
  { id: "order", label: "Order" },
  { id: "city", label: "City", isGroupable: true },
  { id: "total", label: "Total", type: "number", aggregate: "sum" },
];

describe("sortCollectionItems", () => {
  it("sorts numeric text by its number and numbers by value, empties last", () => {
    expect(
      sortCollectionItems(ROWS, [{ column: "order", direction: "ascending" }], "en").map(
        (r) => r.id,
      ),
    ).toEqual(["d", "b", "a", "c"]);
    expect(
      sortCollectionItems(ROWS, [{ column: "total", direction: "descending" }], "en").map(
        (r) => r.id,
      ),
    ).toEqual(["a", "b", "d", "c"]);
    expect(
      sortCollectionItems(ROWS, [{ column: "total", direction: "ascending" }], "en").map(
        (r) => r.id,
      ),
    ).toEqual(["d", "b", "a", "c"]);
  });
  it("breaks ties by the next key and keeps the input order last", () => {
    const sorted = sortCollectionItems(
      ROWS,
      [
        { column: "city", direction: "ascending" },
        { column: "total", direction: "descending" },
      ],
      "en",
    );
    expect(sorted.map((r) => r.id)).toEqual(["b", "a", "c", "d"]);
    expect(sortCollectionItems(ROWS, [], "en")).toBe(ROWS);
  });
});

describe("nextCollectionSort", () => {
  it("cycles ascending, descending, off and replaces the other keys", () => {
    const one = nextCollectionSort([], "city");
    expect(one).toEqual([{ column: "city", direction: "ascending" }]);
    const two = nextCollectionSort(one, "city");
    expect(two).toEqual([{ column: "city", direction: "descending" }]);
    expect(nextCollectionSort(two, "city")).toEqual([]);
    expect(nextCollectionSort(two, "total")).toEqual([{ column: "total", direction: "ascending" }]);
  });
  it("adds, flips in place and drops keys when additive", () => {
    const added = nextCollectionSort([{ column: "city", direction: "ascending" }], "total", true);
    expect(added.map((key) => key.column)).toEqual(["city", "total"]);
    const flipped = nextCollectionSort(added, "city", true);
    expect(flipped[0]).toEqual({ column: "city", direction: "descending" });
    expect(nextCollectionSort(flipped, "city", true).map((key) => key.column)).toEqual(["total"]);
  });
});

describe("collectionFilterMatches", () => {
  const big = { id: "1", field: "total", operator: "greater", value: "100" } as const;
  const riyadh = { id: "2", field: "city", operator: "equals", value: "riyadh" } as const;
  it("matches all or any of the conditions", () => {
    expect(
      ROWS.filter((r) =>
        collectionFilterMatches({ match: "all", conditions: [big, riyadh] }, r),
      ).map((r) => r.id),
    ).toEqual(["a"]);
    expect(
      ROWS.filter((r) =>
        collectionFilterMatches({ match: "any", conditions: [big, riyadh] }, r),
      ).map((r) => r.id),
    ).toEqual(["a", "b", "c"]);
  });
  it("treats a nested group as one more condition and ignores empty ones", () => {
    const tree = {
      match: "all" as const,
      conditions: [riyadh],
      groups: [
        {
          match: "any" as const,
          conditions: [big, { id: "3", field: "total", operator: "is_empty", value: "" } as const],
        },
        { match: "any" as const, conditions: [] },
      ],
    };
    expect(ROWS.filter((r) => collectionFilterMatches(tree, r)).map((r) => r.id)).toEqual([
      "a",
      "c",
    ]);
    expect(filterConditionCountOf(tree)).toBe(3);
    expect(collectionFilterMatches({ match: "all", conditions: [] }, ROWS[0] as never)).toBe(true);
  });
});

describe("collectionSearchMatches", () => {
  it("folds case and Arabic letter forms, and an empty search matches", () => {
    expect(collectionSearchMatches(ROWS[0] as never, "RIYA", ["city"])).toBe(true);
    expect(collectionSearchMatches(ROWS[3] as never, "الرياض", ["city"])).toBe(true);
    expect(collectionSearchMatches(ROWS[1] as never, "riya", ["city"])).toBe(false);
    expect(collectionSearchMatches(ROWS[1] as never, "", ["city"])).toBe(true);
  });
});

describe("groups and aggregates", () => {
  it("groups in first-seen order with each group's totals", () => {
    const groups = collectionGroupsOf(ROWS, "city", { total: "sum" });
    expect(
      groups.map((group) => [group.key, group.items.length, group.aggregates["total"]]),
    ).toEqual([
      ["Riyadh", 2, 300],
      ["Jeddah", 1, 120],
      ["الرياض", 1, 50],
    ]);
  });
  it("computes every aggregate kind, skipping empty values", () => {
    expect(collectionAggregatesOf(ROWS, { total: "avg" })).toEqual({ total: 470 / 3 });
    expect(collectionAggregatesOf(ROWS, { total: "count" })).toEqual({ total: 4 });
    expect(collectionAggregatesOf(ROWS, { total: "min" })).toEqual({ total: 50 });
    expect(collectionAggregatesOf(ROWS, { total: "max" })).toEqual({ total: 300 });
  });
});

describe("column ops", () => {
  it("applies names, widths, wrap and hides, but never hides the row header", () => {
    const resolved = resolveCollectionColumns(COLUMNS, [
      { id: "order", isHidden: true },
      { id: "city", label: "المدينة", width: 200, wrap: false },
      { id: "total", isHidden: true },
    ]);
    expect(resolved.map((column) => [column.id, column.label, column.isHidden])).toEqual([
      ["order", "Order", false],
      ["city", "المدينة", false],
      ["total", "Total", true],
    ]);
    expect(resolved[1]).toMatchObject({ width: 200, wrap: false, defaultLabel: "City" });
  });
  it("draws pinned start first and pinned end last, and appends unknown columns", () => {
    const resolved = resolveCollectionColumns(COLUMNS, [
      { id: "total", pin: "start" },
      { id: "order", pin: "end" },
    ]);
    expect(resolved.map((column) => column.id)).toEqual(["total", "city", "order"]);
    const unpinned = resolveCollectionColumns(
      [{ id: "order", label: "Order", pin: "start" }],
      [{ id: "order", pin: null }],
    );
    expect(unpinned[0]?.pin).toBeUndefined();
  });
  it("moves a column and clamps the index", () => {
    const states = [{ id: "a" }, { id: "b" }, { id: "c" }];
    expect(moveColumnState(states, "a", 2).map((s) => s.id)).toEqual(["b", "c", "a"]);
    expect(moveColumnState(states, "c", -5).map((s) => s.id)).toEqual(["c", "a", "b"]);
    expect(moveColumnState(states, "x", 0)).toBe(states);
  });
});

describe("applyCollection and the query", () => {
  const state = defaultCollectionStateOf(COLUMNS, { pageSize: 2, search: "riyadh" });
  const columns = resolveCollectionColumns(COLUMNS, state.columns);
  it("searches, sorts and pages", () => {
    const paged = applyCollection(
      ROWS,
      { ...state, sort: [{ column: "order", direction: "ascending" }] },
      columns,
      "page",
      "en",
    );
    expect(paged.matched.map((r) => r.id)).toEqual(["a", "c"]);
    expect(paged.pageCount).toBe(1);
    const all = applyCollection(ROWS, { ...state, search: "", page: 1 }, columns, "page", "en");
    expect(all.rows.map((r) => r.id)).toEqual(["c", "d"]);
    expect(all.hasMore).toBe(false);
    const infinite = applyCollection(ROWS, { ...state, search: "" }, columns, "infinite", "en");
    expect(infinite.rows).toHaveLength(2);
    expect(infinite.hasMore).toBe(true);
  });
  it("leaves hidden columns out of the search", () => {
    const hidden = resolveCollectionColumns(COLUMNS, [{ id: "city", isHidden: true }]);
    expect(applyCollection(ROWS, state, hidden, "none", "en").rows).toHaveLength(0);
  });
  it("writes a plain query object for a server", () => {
    const query = collectionQueryOf(
      { ...state, sort: [{ column: "total", direction: "descending" }] },
      columns,
      "cursor",
    );
    expect(query).toEqual({
      search: "riyadh",
      filter: { match: "all", conditions: [] },
      sort: [{ column: "total", direction: "descending" }],
      groupBy: null,
      paging: "cursor",
      page: 0,
      pageSize: 2,
      cursor: null,
      columns: ["order", "city", "total"],
    });
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- the test proves the query survives JSON, which structuredClone would not
    expect(JSON.parse(JSON.stringify(query))).toEqual(query);
  });
  it("starts with the columns' own aggregates", () => {
    expect(state.aggregates).toEqual({ total: "sum" });
  });
  it("sums the other number columns once a footer is on, and leaves text columns empty", () => {
    const withQuantity = [
      ...COLUMNS,
      { id: "quantity", label: "Quantity", type: "number" as const },
    ];
    expect(defaultCollectionStateOf(withQuantity).aggregates).toEqual({
      total: "sum",
      quantity: "sum",
    });
    expect(
      defaultCollectionStateOf(withQuantity.filter((c) => c.id !== "total")).aggregates,
    ).toEqual({});
  });
});

describe("createLocalCollectionStore", () => {
  const memory = new Map<string, string>();
  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => memory.get(key) ?? null,
        setItem: (key: string, value: string) => memory.set(key, value),
      },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("round-trips a snapshot without the selection or page", () => {
    const store = createLocalCollectionStore("t.");
    const snapshot = collectionSnapshotOf(
      defaultCollectionStateOf(COLUMNS, { selection: ["a"], page: 3, density: "compact" }),
      [{ id: "v", label: "Mine", state: { search: "x" } }],
      "v",
    );
    store.save("orders", snapshot);
    expect(memory.has("t.orders")).toBe(true);
    const read = store.get("orders") as CollectionSnapshot | null;
    expect(read).toEqual(snapshot);
    expect(read && "selection" in read.state).toBe(false);
    expect(read && "page" in read.state).toBe(false);
  });
  it("reads none for a missing key, bad JSON or another version", () => {
    const store = createLocalCollectionStore("t.");
    expect(store.get("none")).toBeNull();
    memory.set("t.bad", "{");
    expect(store.get("bad")).toBeNull();
    memory.set("t.old", JSON.stringify({ version: 0 }));
    expect(store.get("old")).toBeNull();
  });
});
