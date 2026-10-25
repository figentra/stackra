/**
 * Stackra file contract:
 * Purpose: unit and type tests of `widgetRef`: the widget key, the query and the display options kept as declared, and
 *          the refused key.
 * Boundary: test only; the display options are opaque values here, as they are to this package.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0307 (widgets).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { queryRef } from "#core/functions/query-ref.function";
import { widgetRef } from "#core/functions/widget-ref.function";

class ListLowStockQuery extends queryRef("inventory.stock.list_low@1", {
  input: z.object({ limit: z.number().int().default(20) }),
  output: z.object({ items: z.array(z.object({ variantId: z.string() })) }),
}) {}

class LowStockWidget extends widgetRef("inventory.low_stock", {
  query: ListLowStockQuery,
  size: "medium",
  display: { kind: "list", primary: "variantId" },
}) {}

describe("widgetRef", () => {
  it("carries the key, the query and the display options", () => {
    expect(LowStockWidget.key).toBe("inventory.low_stock");
    expect(LowStockWidget.query).toBe(ListLowStockQuery);
    expect(LowStockWidget.options).toEqual({
      size: "medium",
      display: { kind: "list", primary: "variantId" },
    });
    expect(Object.isFrozen(LowStockWidget.options)).toBe(true);
  });

  it("refuses a key that is not <module>.<snake_name>", () => {
    expect(() => widgetRef("LowStock", { query: ListLowStockQuery })).toThrow(RangeError);
  });

  it("types the query and the options as declared", () => {
    expectTypeOf(LowStockWidget.query).toEqualTypeOf<typeof ListLowStockQuery>();
    expectTypeOf(LowStockWidget.options.size).toEqualTypeOf<"medium">();
  });
});
