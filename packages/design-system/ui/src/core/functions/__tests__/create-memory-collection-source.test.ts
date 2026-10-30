/**
 * Stackra file contract:
 * Purpose: proves `createMemoryCollectionSource()`: it answers a query as a server would (search, filter, the group
 *          first then the sort, the page, the `infinite` slice and the `cursor` page with the next cursor), rejects a
 *          fetch whose signal fires, and resolves a selection descriptor to every match but its `except` ids.
 * Boundary: the pure driver alone, with no delay.
 * Runtime: node
 * Governing contract: data-collection plan (owner, 2026-10-29), wave 4 (server mode end to end); ADR 0022 (test
 *          placement); STA-1371.
 */
import type { CollectionColumn } from "#contracts/types/collection-column.type";
import type { CollectionQuery } from "#contracts/types/collection-query.type";
import { createMemoryCollectionSource } from "#core/functions/create-memory-collection-source.function";

const COLUMNS: readonly CollectionColumn[] = [
  { id: "name", label: "Name" },
  { id: "city", label: "City" },
  { id: "total", label: "Total", type: "number" },
];
const ROWS = Array.from({ length: 25 }, (_, index) => ({
  id: `r${index}`,
  name: `Name ${String(index).padStart(2, "0")}`,
  city: ["Riyadh", "Jeddah", "Dammam"][index % 3] ?? "",
  total: index,
}));
const QUERY: CollectionQuery = {
  search: "",
  filter: { match: "all", conditions: [] },
  sort: [],
  groupBy: null,
  paging: "page",
  page: 0,
  pageSize: 10,
  cursor: null,
  columns: ["name", "city", "total"],
};
const signal = () => new AbortController().signal;

describe("createMemoryCollectionSource", () => {
  const source = createMemoryCollectionSource(ROWS, COLUMNS);

  it("answers a page with the total and the next cursor", async () => {
    const page = await source.fetch({ ...QUERY, page: 2 }, signal());
    expect(page.items.map((row) => row.id)).toEqual(["r20", "r21", "r22", "r23", "r24"]);
    expect(page.totalCount).toBe(25);
    expect(page.nextCursor).toBeNull();
  });

  it("searches, filters and sorts, grouped rows first by their group", async () => {
    const page = await source.fetch(
      {
        ...QUERY,
        search: "riyadh",
        sort: [{ column: "total", direction: "descending" }],
        groupBy: "city",
      },
      signal(),
    );
    expect(page.totalCount).toBe(9);
    expect(page.items[0]?.id).toBe("r24");
    const grouped = await source.fetch({ ...QUERY, groupBy: "city", pageSize: 25 }, signal());
    expect(
      grouped.items
        .map((row) => row.city)
        .slice(0, 8)
        .every((city) => city === "Dammam"),
    ).toBe(true);
  });

  it("pages by cursor", async () => {
    const first = await source.fetch({ ...QUERY, paging: "cursor" }, signal());
    expect(first.nextCursor).toBe("10");
    const next = await source.fetch({ ...QUERY, paging: "cursor", cursor: "10" }, signal());
    expect(next.items[0]?.id).toBe("r10");
  });

  it("rejects a fetch whose signal fires", async () => {
    const slow = createMemoryCollectionSource(ROWS, COLUMNS, { latency: 1000 });
    const controller = new AbortController();
    const answer = slow.fetch(QUERY, controller.signal);
    controller.abort(new Error("replaced"));
    await expect(answer).rejects.toThrow("replaced");
  });

  it("resolves every match but the except ids, and ids as they are", async () => {
    const ids = await source.resolve?.({
      kind: "all-matching",
      search: "jeddah",
      filter: { match: "all", conditions: [] },
      totalCount: 8,
      except: ["r1"],
    });
    expect(ids).toHaveLength(7);
    expect(ids).not.toContain("r1");
    expect(await source.resolve?.({ kind: "ids", ids: ["r3"] })).toEqual(["r3"]);
  });
});
