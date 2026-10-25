/**
 * Stackra file contract:
 * Purpose: proves `queryWithFilter` sets a filter, replaces one in place so its position holds, removes it for
 *          `undefined` and for a value that filters nothing, keeps the search and the sort, never changes the query it
 *          is given, and keeps a yes or no of "no" (which is an answer).
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-196
import type { ResourceQuery } from "#contracts/types/resource-query.type";
import { queryWithFilter } from "#core/functions/query-with-filter.function";

const QUERY: ResourceQuery = {
  search: "ada",
  filterValues: { status: "paid", region: ["eu", "us"] },
  sort: { column: "total", direction: "ascending" },
};

describe("queryWithFilter", () => {
  it("adds a filter and keeps the search and the sort", () => {
    const next = queryWithFilter(QUERY, "name", "Ada");
    expect(next.filterValues).toEqual({ status: "paid", region: ["eu", "us"], name: "Ada" });
    expect(next.search).toBe("ada");
    expect(next.sort).toBe(QUERY.sort);
  });

  it("replaces a filter in place, so the order of the chips holds", () => {
    const next = queryWithFilter(QUERY, "status", "refunded");
    expect(Object.keys(next.filterValues)).toEqual(["status", "region"]);
    expect(next.filterValues["status"]).toBe("refunded");
  });

  it("removes a filter for undefined and for a value that filters nothing", () => {
    expect(queryWithFilter(QUERY, "status", undefined).filterValues).toEqual({
      region: ["eu", "us"],
    });
    expect(queryWithFilter(QUERY, "status", "  ").filterValues).toEqual({ region: ["eu", "us"] });
    expect(queryWithFilter(QUERY, "region", []).filterValues).toEqual({ status: "paid" });
    expect(queryWithFilter(QUERY, "total", { min: null, max: null }).filterValues).toEqual(
      QUERY.filterValues,
    );
  });

  it("keeps a no, because a no is an answer", () => {
    expect(queryWithFilter(QUERY, "isGift", false).filterValues["isGift"]).toBe(false);
  });

  it("never changes the query it is given", () => {
    const before = JSON.stringify(QUERY);
    queryWithFilter(QUERY, "status", undefined);
    queryWithFilter(QUERY, "name", "Ada");
    expect(JSON.stringify(QUERY)).toBe(before);
  });
});
