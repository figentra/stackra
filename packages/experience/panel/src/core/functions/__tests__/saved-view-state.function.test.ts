/**
 * Stackra file contract:
 * Purpose: unit tests of `savedViewState`: no view draws the table's visible columns, filter defaults and default
 *          sort; a view reorders and narrows the columns, drops a column the table no longer has, and overrides the
 *          filter values and the sort.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decision 1).
 */
import { SortDirection } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Count } from "#core/enums/count.enum";
import { savedViewState } from "#core/functions/saved-view-state.function";
import type { TableNode } from "#core/types/table-node.type";

const table: TableNode = {
  columns: [
    { kind: "value", key: "number" },
    { kind: "value", key: "status" },
    { kind: "value", key: "notes", hidden: true },
  ],
  filters: [{ kind: "value", key: "status", default: "open" }, { kind: "trashed" }],
  defaultSort: { key: "number", direction: SortDirection.Desc },
  count: Count.Estimated,
};

describe("savedViewState", () => {
  it("draws the table's own state without a view", () => {
    const state = savedViewState(table, undefined);
    expect(state.columns.map(({ key }) => key)).toEqual(["number", "status"]);
    expect(state.filterValues).toEqual({ status: "open" });
    expect(state.sort).toEqual(table.defaultSort);
  });

  it("applies a view's columns, filters and sort", () => {
    const sort = { key: "status", direction: SortDirection.Asc };
    const state = savedViewState(table, {
      columns: ["status", "gone", "number"],
      filter: { status: "paid" },
      sort,
    });
    expect(state.columns.map(({ key }) => key)).toEqual(["status", "number"]);
    expect(state.filterValues).toEqual({ status: "paid" });
    expect(state.sort).toBe(sort);
  });

  it("draws nothing for a resource with no recorded table", () => {
    expect(savedViewState(undefined, undefined)).toEqual({
      columns: [],
      filterValues: {},
      sort: undefined,
    });
  });
});
