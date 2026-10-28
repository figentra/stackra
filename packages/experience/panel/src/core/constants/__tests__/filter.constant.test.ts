/**
 * Stackra file contract:
 * Purpose: unit tests of `Filter`: field, principal, range, date range, comparison, contains, is-null and trashed
 *          filter nodes, frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 2); reporting gap 5.
 */
import { describe, expect, it } from "@stackra/testing";

import { Filter } from "#core/constants/filter.constant";
import { FilterComparison } from "#core/enums/filter-comparison.enum";
import { TimeRange } from "#core/enums/time-range.enum";

describe("Filter", () => {
  it("builds frozen filter nodes", () => {
    expect(Filter.from("status", { default: ["paid"], pinned: true })).toEqual({
      kind: "value",
      key: "status",
      default: ["paid"],
      pinned: true,
    });
    expect(Filter.principal("customerId")).toEqual({ kind: "principal", key: "customerId" });
    expect(Filter.trashed()).toEqual({ kind: "trashed" });
    expect(Object.isFrozen(Filter.trashed())).toBe(true);
  });

  it("builds the operator filter nodes", () => {
    expect(Filter.range("total")).toEqual({ kind: "range", key: "total" });
    expect(Filter.dateRange("createdAt", { default: TimeRange.Last7Days })).toEqual({
      kind: "dateRange",
      key: "createdAt",
      default: "last_7_days",
    });
    expect(Filter.compare("total", FilterComparison.Gte, { pinned: true })).toEqual({
      kind: "compare",
      key: "total",
      operator: "gte",
      pinned: true,
    });
    expect(Filter.contains("name")).toEqual({ kind: "contains", key: "name" });
    expect(Filter.isNull("paidAt")).toEqual({ kind: "isNull", key: "paidAt" });
    expect(Object.isFrozen(Filter.compare("total", FilterComparison.Ne))).toBe(true);
  });
});
