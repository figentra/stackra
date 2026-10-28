/**
 * Stackra file contract:
 * Purpose: unit tests of the builder records' own checks: a span or grid outside 1 to 12, a list limit outside 1 to 100, an
 *          empty KPI group and an empty place list are refused, a field records `essential`, a later call of a table
 *          method replaces the earlier, and operator filters and tiebreak sort keys record (two tiebreaks at most).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 5, 11 and 14).
 */
import { SortDirection } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Count } from "#core/enums/count.enum";
import { FilterComparison } from "#core/enums/filter-comparison.enum";
import { ActionsRecord } from "#core/records/actions.record";
import { DisplayRecord } from "#core/records/display.record";
import { FieldsRecord } from "#core/records/fields.record";
import { TableRecord } from "#core/records/table.record";

interface Row {
  readonly id: string;
  readonly items: readonly { readonly sku: string }[];
}

class CancelAction {}

describe("builder records", () => {
  it("refuses out-of-range layout values", () => {
    const fields = new FieldsRecord<Row>();
    expect(() => fields.from("id").span(13)).toThrow(RangeError);
    expect(() => fields.grid(0, [])).toThrow(RangeError);
    const display = new DisplayRecord<Row>();
    expect(() => display.list("items", { primary: "sku" }).limit(101)).toThrow(RangeError);
    expect(() => display.kpiGroup([])).toThrow(RangeError);
    expect(() => new ActionsRecord<Row>().run(CancelAction).in()).toThrow(RangeError);
  });

  it("records a field as essential for normal mode", () => {
    const fields = new FieldsRecord<Row>();
    expect(fields.from("id").span(6).essential().toNode()).toEqual({
      kind: "value",
      key: "id",
      span: 6,
      essential: true,
    });
    expect(fields.from("id").toNode()).toEqual({ kind: "value", key: "id" });
  });

  it("records operator filters and a multi-key default sort, refusing a third tiebreak", () => {
    const table = new TableRecord<Row>()
      .filters((f) => [
        f.range("id"),
        f.dateRange("id").pinned(),
        f.compare("id", FilterComparison.Lt),
      ])
      .defaultSort("id", SortDirection.Asc)
      .thenSort("id", SortDirection.Desc);
    expect(table.toNode()).toMatchObject({
      filters: [
        { kind: "range", key: "id" },
        { kind: "dateRange", key: "id", pinned: true },
        { kind: "compare", key: "id", operator: "lt" },
      ],
      defaultSort: { key: "id", direction: "asc" },
      thenSort: [{ key: "id", direction: "desc" }],
    });
    table.thenSort("id", SortDirection.Asc);
    expect(() => table.thenSort("id", SortDirection.Asc)).toThrow(RangeError);
  });

  it("replaces a table method's earlier call and keeps the count mode", () => {
    const table = new TableRecord<Row>()
      .columns((c) => [c.from("id")])
      .columns((c) => [c.principal("id")])
      .defaultSort("id", SortDirection.Asc)
      .count(Count.Exact);
    expect(table.toNode()).toEqual({
      columns: [{ kind: "principal", key: "id" }],
      filters: [],
      defaultSort: { key: "id", direction: "asc" },
      count: "exact",
    });
  });
});
