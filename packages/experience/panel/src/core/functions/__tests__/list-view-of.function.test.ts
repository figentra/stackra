/**
 * Stackra file contract:
 * Purpose: unit tests of `listViewOf` and `listFiltersOf`: a panel view becomes an engine view (its filter values as
 *          quick-filter conditions over the table's defaults, its sort, its columns, group, totals and layout), a value no
 *          quick filter holds is kept as `rest`, and the engine's filter reads back as the list query's filter values.
 * Boundary: unit tier, pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decision 7); ADR 0505.
 */
import { SortDirection } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import type { CollectionColumn, CollectionFilter } from "@stackra/ui/contracts";

import { Count } from "#core/enums/count.enum";
import { listFiltersOf } from "#core/functions/list-filters-of.function";
import { listViewOf } from "#core/functions/list-view-of.function";
import type { TableNode } from "#core/types/table-node.type";

const table = {
  columns: [
    { kind: "value", key: "number" },
    { kind: "value", key: "status" },
  ],
  filters: [
    { kind: "value", key: "status", default: "open" },
    { kind: "range", key: "total" },
    { kind: "dateRange", key: "createdAt" },
  ],
  count: Count.Estimated,
} as unknown as TableNode;

const NONE: CollectionFilter = { match: "all", conditions: [] };

const columns: readonly CollectionColumn[] = [
  { id: "number", label: "Number", isFilterable: false },
  {
    id: "status",
    label: "Status",
    type: "choice",
    options: [
      { id: "open", label: "open" },
      { id: "paid", label: "paid" },
    ],
  },
  { id: "total", label: "Total", type: "number", isHidden: true },
  { id: "createdAt", label: "Created", type: "date", isHidden: true },
];

describe("listViewOf", () => {
  it("maps filters, sort, columns, group, totals and layout", () => {
    const { view, rest } = listViewOf(
      "view_1",
      "Paid",
      {
        filter: { status: "paid", total: { min: 10, max: null }, createdAt: "last_7_days" },
        sort: { key: "status", direction: SortDirection.Asc },
        columns: ["status"],
        group: { by: "status" } as never,
        totals: [
          { key: "total", aggregate: "sum" },
          { key: "total", aggregate: "distinct" },
        ] as never,
        layout: "gallery" as never,
      },
      table,
      columns,
    );
    expect(view.state.filter?.conditions.map((condition) => condition.operator)).toEqual([
      "in",
      "between",
    ]);
    expect(rest).toEqual({ createdAt: "last_7_days" });
    expect(view.state.sort).toEqual([{ column: "status", direction: "ascending" }]);
    expect(view.state.columns?.[0]).toEqual({ id: "status" });
    expect(view.state.columns?.find((column) => column.id === "number")?.isHidden).toBe(true);
    expect(view.state.groupBy).toBeNull();
    expect(view.state.aggregates).toEqual({ total: "sum" });
    expect(view.state.layout).toBe("cards");
    expect(listFiltersOf(view.state.filter ?? NONE, columns)).toEqual({
      values: { status: ["paid"], total: { min: 10, max: null } },
      unsent: [],
    });
  });

  it("starts the all-rows view from the table's defaults", () => {
    const { view } = listViewOf("all", "All", undefined, table, columns);
    expect(listFiltersOf(view.state.filter ?? NONE, columns).values).toEqual({ status: ["open"] });
    expect(view.state.sort).toEqual([]);
  });
});

/** One condition as the advanced editor writes it. */
const condition = (id: string, field: string, operator: string, value: string | string[]) =>
  ({ id, field, operator, value }) as CollectionFilter["conditions"][number];

describe("listFiltersOf", () => {
  it("sends the advanced editor's conditions in their wire form, one per key, after the quick filters", () => {
    const filter: CollectionFilter = {
      match: "all",
      conditions: [
        condition("a", "status", "not_equals", "open"),
        condition("b", "total", "greater", "10"),
        condition("c", "total", "less", "99"),
        condition("d", "createdAt", "after", "2026-01-31"),
        condition("e", "number", "equals", "7"),
      ],
    };
    // A second condition on a key, and one on a column the panel does not filter, are named as unsent.
    expect(listFiltersOf(filter, columns)).toEqual({
      values: {
        status: { op: "ne", value: "open" },
        total: { op: "gt", value: 10 },
        createdAt: { op: "gte", value: "2026-02-01" },
      },
      unsent: ["c", "e"],
    });
    expect(
      listFiltersOf(
        {
          match: "all",
          conditions: [
            condition("a", "status", "in", ["open", "paid"]),
            condition("b", "total", "between", ["", "50"]),
            condition("c", "createdAt", "between", ["2026-01-01", "2026-01-31"]),
          ],
        },
        columns,
      ),
    ).toEqual({
      values: {
        status: ["open", "paid"],
        total: { op: "range", to: 50 },
        createdAt: { op: "dateRange", from: "2026-01-01", to: "2026-01-31" },
      },
      unsent: [],
    });
  });

  it("names what the server cannot read as unsent: an any-match filter, a negated list, a nested group", () => {
    expect(
      listFiltersOf(
        {
          match: "any",
          conditions: [
            condition("filter:status", "status", "in", ["open"]),
            condition("b", "total", "less", "5"),
          ],
          groups: [{ match: "all", conditions: [] }],
        },
        columns,
      ),
    ).toEqual({ values: {}, unsent: ["filter:status", "b", "group-0"] });
    expect(
      listFiltersOf(
        {
          match: "all",
          conditions: [
            condition("filter:status", "status", "in", ["open"]),
            condition("a", "total", "not_in", ["5"]),
          ],
          groups: [{ id: "g1", match: "any", conditions: [] }],
        },
        columns,
      ),
    ).toEqual({ values: { status: ["open"] }, unsent: ["a", "g1"] });
  });
});
