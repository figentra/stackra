/**
 * Stackra file contract:
 * Purpose: unit tests of the builder records' own checks: a span or grid outside 1 to 12, a list limit outside 1 to 100, an
 *          empty KPI group and an empty place list are refused, and a later call of a table method replaces the earlier.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 5, 11 and 14).
 */
import { SortDirection } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Count } from "#core/enums/count.enum";
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
