/**
 * Stackra file contract:
 * Purpose: proves `clearResourceQueryFilters` empties the search and the filters, keeps the sort, and returns a new
 *          object without changing the query it was given.
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-187
import { clearResourceQueryFilters } from "#core/functions/clear-resource-query-filters.function";
import type { ResourceQuery } from "#contracts/types/resource-query.type";

describe("clearResourceQueryFilters", () => {
  const query: ResourceQuery = {
    search: "ord_1",
    filterValues: { status: ["paid"] },
    sort: { column: "total", direction: "descending" },
  };

  it("removes the search text and every filter", () => {
    const cleared = clearResourceQueryFilters(query);
    expect(cleared.search).toBe("");
    expect(cleared.filterValues).toEqual({});
  });

  it("keeps the sort the user chose", () => {
    expect(clearResourceQueryFilters(query).sort).toEqual({
      column: "total",
      direction: "descending",
    });
  });

  it("leaves the query it was given as it was", () => {
    const cleared = clearResourceQueryFilters(query);
    expect(cleared).not.toBe(query);
    expect(query.search).toBe("ord_1");
    expect(query.filterValues).toEqual({ status: ["paid"] });
  });
});
