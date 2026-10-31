/**
 * Stackra file contract:
 * Purpose: unit tests of `filterWireValue`: each operator kind turns its drawn value into the wire `TableFilter`, a wire
 *          value passes as is, an empty value is not sent, and a value filter is unchanged.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 2); reporting gap 5.
 */
import { describe, expect, it } from "@stackra/testing";

import { filterWireValue } from "#core/functions/filter-wire-value.function";

/** A calendar day as `@internationalized/date` prints it. */
const day = (text: string) => ({ toString: () => text });

describe(filterWireValue, () => {
  it("turns a number range into inclusive bounds and drops an empty one", () => {
    const node = { kind: "range", key: "total" } as const;
    expect(filterWireValue(node, { min: 10, max: null })).toEqual({ op: "range", from: 10 });
    expect(filterWireValue(node, { min: null, max: null })).toBeUndefined();
  });

  it("turns calendar days or a time range code into a date range", () => {
    const node = { kind: "dateRange", key: "createdAt" } as const;
    expect(filterWireValue(node, { start: day("2026-10-01"), end: day("2026-10-28") })).toEqual({
      op: "dateRange",
      from: "2026-10-01",
      to: "2026-10-28",
    });
    expect(filterWireValue(node, "last_7_days")).toEqual({ op: "dateRange", range: "last_7_days" });
    expect(filterWireValue(node, { start: null, end: null })).toBeUndefined();
  });

  it("builds a comparison, contains and is-null, and drops blank text", () => {
    expect(filterWireValue({ kind: "compare", key: "total", operator: "gte" }, " 5 ")).toEqual({
      op: "gte",
      value: "5",
    });
    expect(filterWireValue({ kind: "contains", key: "name" }, " ada ")).toEqual({
      op: "contains",
      value: "ada",
    });
    expect(filterWireValue({ kind: "contains", key: "name" }, "  ")).toBeUndefined();
    expect(filterWireValue({ kind: "isNull", key: "paidAt" }, false)).toEqual({
      op: "isNull",
      value: false,
    });
  });

  it("passes a wire value and a plain value filter unchanged", () => {
    const wire = { op: "range", from: 1 };
    expect(filterWireValue({ kind: "range", key: "total" }, wire)).toBe(wire);
    expect(filterWireValue({ kind: "value", key: "status" }, ["paid"])).toEqual(["paid"]);
    // A list is "any of" on every kind, so an advanced "is any of" on a comparison filter is not turned into one.
    expect(filterWireValue({ kind: "compare", key: "total", operator: "ne" }, [5, 7])).toEqual([
      5, 7,
    ]);
  });
});
