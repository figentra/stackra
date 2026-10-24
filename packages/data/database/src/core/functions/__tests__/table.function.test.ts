/**
 * Stackra file contract:
 * Purpose: unit and type tests of `table`: the qualified name splits into schema and table, each field (and each part
 *          of a money field) becomes a column reference, and a malformed name is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 1); ADR 0294 (decision 20); ADR 0022; ADR 0269.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { table } from "#core/functions/table.function";
import { ColumnRef } from "#core/values/column-ref.value";

describe(table, () => {
  it("builds the template's table constant", () => {
    const Orders = table("orders.orders", {
      id: "id",
      total: { minor: "total_minor", currency: "total_currency" },
    });
    expect([Orders.name, Orders.schema, Orders.table]).toEqual([
      "orders.orders",
      "orders",
      "orders",
    ]);
    expect(Orders.columns.id).toBeInstanceOf(ColumnRef);
    expect(Orders.columns.total.minor.name).toBe("total_minor");
    expect(Object.isFrozen(Orders.columns)).toBe(true);
    expectTypeOf(Orders.columns.total.currency).toEqualTypeOf<ColumnRef>();
  });

  it("refuses a name that is not <schema>.<table> or a column that is not snake_case", () => {
    expect(() => table("orders", { id: "id" })).toThrow(TypeError);
    expect(() => table("a.b.c", { id: "id" })).toThrow(/not <schema>.<table>/);
    expect(() => table("orders.orders", { id: "Id" })).toThrow(TypeError);
  });
});
