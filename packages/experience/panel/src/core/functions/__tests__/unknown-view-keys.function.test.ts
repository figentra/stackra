/**
 * Stackra file contract:
 * Purpose: unit tests of `unknownViewKeys`: a view of declared keys passes; an undeclared filter, sort, column, group,
 *          total or layout path is reported once, in order; a sort on a column that is not sortable is unknown; a
 *          resource with no recorded table declares nothing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decision 4).
 */
import { SortDirection } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Count } from "#core/enums/count.enum";
import { unknownViewKeys } from "#core/functions/unknown-view-keys.function";
import type { TableNode } from "#core/types/table-node.type";

const table: TableNode = {
  columns: [
    { kind: "value", key: "number", sortable: true },
    { kind: "value", key: "status" },
    { kind: "money", key: "totals.totalMinor" },
  ],
  filters: [{ kind: "value", key: "status" }, { kind: "trashed" }],
  defaultSort: { key: "createdAt", direction: SortDirection.Desc },
  count: Count.Estimated,
};

const empty = { filter: {}, totals: [] };

describe("unknownViewKeys", () => {
  it("passes a view of declared keys", () => {
    expect(
      unknownViewKeys(
        {
          filter: { status: "open", trashed: "with" },
          sort: { key: "createdAt", direction: SortDirection.Asc },
          columns: ["number", "status"],
          group: { by: "status" },
          totals: [{ key: "totals.totalMinor", aggregate: "sum" }],
          layoutBy: "status",
        },
        table,
      ),
    ).toEqual([]);
  });

  it("reports each undeclared key once, in order", () => {
    expect(
      unknownViewKeys(
        {
          filter: { channel: "web" },
          sort: { key: "status", direction: SortDirection.Asc },
          columns: ["legacy", "legacy"],
          // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
          group: { by: "status", then: "region" },
          totals: [{ key: "weight", aggregate: "sum" }],
          layoutBy: "dueOn",
        },
        table,
      ),
    ).toEqual(["channel", "status", "legacy", "region", "weight", "dueOn"]);
  });

  it("finds nothing declared without a recorded table", () => {
    expect(unknownViewKeys({ ...empty, columns: ["number"] }, undefined)).toEqual(["number"]);
    expect(unknownViewKeys(empty, undefined)).toEqual([]);
  });
});
