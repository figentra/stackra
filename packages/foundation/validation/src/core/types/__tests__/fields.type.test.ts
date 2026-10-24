/**
 * Stackra file contract:
 * Purpose: type tests of `Fields<T>`: methods and the protected kind brand drop out; optional and readonly fields keep
 *          their modifiers; statics are never fields; nested shapes become plain fields.
 * Boundary: test only; type assertions through `expectTypeOf`, with one runtime assertion so the file runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import type { Fields } from "#core/types/fields.type";

class OrderView extends Schema {
  static readonly MAX_LINES = 100;

  readonly id!: string;

  note?: string;

  paidAt: Date | null = null;

  onChange?: () => void;

  total(): number {
    return 0;
  }
}

class LineView extends Schema {
  sku!: string;
}

class CartView extends Schema {
  lines!: LineView[];

  main: LineView | null = null;
}

describe("Fields", () => {
  it("keeps data fields with their modifiers and drops methods and the brand", () => {
    expectTypeOf<Fields<OrderView>>().toEqualTypeOf<{
      readonly id: string;
      note?: string;
      paidAt: Date | null;
      onChange?: () => void;
    }>();
    expect(OrderView.MAX_LINES).toBe(100);
  });

  it("replaces nested shapes, in arrays and unions too, with their fields", () => {
    expectTypeOf<Fields<CartView>>().toEqualTypeOf<{
      lines: { sku: string }[];
      main: { sku: string } | null;
    }>();
    expectTypeOf({ lines: [{ sku: "a" }], main: null }).toMatchTypeOf<Fields<CartView>>();
    expect(new CartView().main).toBeNull();
  });
});
