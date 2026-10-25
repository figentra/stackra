/**
 * Stackra file contract:
 * Purpose: unit tests of `Column`: each constructor returns a frozen node of its kind with the flags given.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 1 and 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { Column } from "#core/constants/column.constant";

describe("Column", () => {
  it("builds frozen column nodes", () => {
    expect(Column.from("slug", { copyable: true, sortable: true })).toEqual({
      kind: "value",
      key: "slug",
      copyable: true,
      sortable: true,
    });
    expect(Column.principal("customerId")).toEqual({ kind: "principal", key: "customerId" });
    expect(Column.money("totals.totalMinor", { currency: "totals.currency" })).toEqual({
      kind: "money",
      key: "totals.totalMinor",
      currency: "totals.currency",
    });
    expect(Object.isFrozen(Column.count("lines"))).toBe(true);
  });
});
