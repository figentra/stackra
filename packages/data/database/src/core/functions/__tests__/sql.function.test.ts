/**
 * Stackra file contract:
 * Purpose: unit tests of `sql`: values become bound parameters, a table constant's column becomes its quoted name, and
 *          a nested fragment is inlined with its parameters.
 * Boundary: test only; inspects the MikroORM fragment, runs no query.
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 1); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { sql } from "#core/functions/sql.function";
import { table } from "#core/functions/table.function";

const StockLevels = table("inventory.stock_levels", { onHand: "on_hand", reserved: "reserved" });

describe(sql, () => {
  it("binds values and writes columns as quoted names", () => {
    const threshold = 5;
    const fragment = sql`${StockLevels.columns.onHand} - ${StockLevels.columns.reserved} <= ${threshold}`;
    expect(fragment.sql).toBe('"on_hand" - "reserved" <= ?');
    expect(fragment.params).toEqual([5]);
  });

  it("inlines a nested fragment with its parameters", () => {
    const inner = sql`${StockLevels.columns.onHand} > ${1}`;
    const fragment = sql`(${inner}) and ${StockLevels.columns.reserved} = ${0}`;
    expect(fragment.sql).toBe('("on_hand" > ?) and "reserved" = ?');
    expect(fragment.params).toEqual([1, 0]);
  });

  it("never writes a value into the text", () => {
    const fragment = sql`name = ${"x'; drop table orders; --"}`;
    expect(fragment.sql).toBe("name = ?");
  });
});
