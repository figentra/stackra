/**
 * Stackra file contract:
 * Purpose: unit tests of `ColumnRef`: it keeps its table and column and prints as the quoted column name.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0160 (decision 1); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { ColumnRef } from "#core/values/column-ref.value";

describe(ColumnRef, () => {
  it("prints as its quoted name and refuses a name that is not snake_case", () => {
    const column = new ColumnRef("inventory.stock_levels", "on_hand");
    expect([column.table, column.name, String(column)]).toEqual([
      "inventory.stock_levels",
      "on_hand",
      '"on_hand"',
    ]);
    expect(() => new ColumnRef("inventory.stock_levels", "onHand")).toThrow(TypeError);
  });
});
