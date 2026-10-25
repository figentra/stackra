/**
 * Stackra file contract:
 * Purpose: proves `isResourceQueryFiltered` is false for a query with no search, no filter and any sort, true for some
 *          search text or a filter that is set, and false again when the only filters are left empty.
 * Boundary: pure unit test.
 * Runtime: node
 * Governing contract: ADR 0318; ADR 0022 (test placement).
 */
// @covers sta-350:FR-187
import { isResourceQueryFiltered } from "#core/functions/is-resource-query-filtered.function";
import type { ResourceQuery } from "#contracts/types/resource-query.type";

const NONE: ResourceQuery = { search: "", filterValues: {}, sort: null };

describe("isResourceQueryFiltered", () => {
  it("is false when nothing narrows the records, whatever the sort", () => {
    expect(isResourceQueryFiltered(NONE)).toBe(false);
    const sorted = { ...NONE, sort: { column: "total", direction: "descending" } } as const;
    expect(isResourceQueryFiltered(sorted)).toBe(false);
  });

  it("is true for search text and false for blank search text", () => {
    expect(isResourceQueryFiltered({ ...NONE, search: "ord_1" })).toBe(true);
    expect(isResourceQueryFiltered({ ...NONE, search: "  " })).toBe(false);
  });

  it("is true when a filter is set, including a no on a yes or no filter", () => {
    expect(isResourceQueryFiltered({ ...NONE, filterValues: { status: ["paid"] } })).toBe(true);
    expect(isResourceQueryFiltered({ ...NONE, filterValues: { isArchived: false } })).toBe(true);
  });

  it("is false when every filter is left empty", () => {
    const query = { ...NONE, filterValues: { status: [], total: { min: null, max: null } } };
    expect(isResourceQueryFiltered(query)).toBe(false);
  });
});
