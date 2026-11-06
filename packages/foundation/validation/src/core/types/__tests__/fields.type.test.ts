/**
 * Stackra file contract:
 * Purpose: type tests of `Fields<T>`: methods and the protected kind brand drop out; optional and readonly fields keep
 *          their modifiers; statics are never fields; nested shapes become plain fields; a Json field does not recurse
 *          without end (STA-2215).
 * Boundary: test only; type assertions through `expectTypeOf`, with one runtime assertion so the file runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import type { Json } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import type { Fields } from "#core/types/fields.type";
import type { InputFields } from "#core/types/input-fields.type";

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

class EventView extends Schema {
  payload!: Json;

  history: Json[] = [];
}

/** A config-like shape: its brands are public, as `Config`'s `~kind` and `~config` are. */
class BrandedOptions extends Schema {
  declare readonly "~config": { readonly schema: unknown };

  retries = 3;
}

class CartView extends Schema {
  lines!: LineView[];

  main: LineView | null = null;
}

describe("Fields", () => {
  it("drops every public ~ brand, as a config override's check needs (STA-2215)", () => {
    expectTypeOf<keyof Fields<BrandedOptions>>().toEqualTypeOf<"retries">();
    expectTypeOf<keyof InputFields<BrandedOptions>>().toEqualTypeOf<"retries">();
  });

  it("keeps a Json field as Json, without recursing into Json[] (TS2589, STA-2215)", () => {
    // Mutually assignable: a few levels of Json[] are unrolled, the rest stays Json.
    expectTypeOf<Fields<EventView>["payload"]>().toMatchTypeOf<Json>();
    expectTypeOf<Json>().toMatchTypeOf<Fields<EventView>["payload"]>();
    expectTypeOf<Fields<EventView>["history"]>().toMatchTypeOf<Json[]>();
    expectTypeOf<Json[]>().toMatchTypeOf<Fields<EventView>["history"]>();
    expectTypeOf<InputFields<EventView>["payload"]>().toMatchTypeOf<Json>();
    expectTypeOf<Json>().toMatchTypeOf<InputFields<EventView>["payload"]>();
  });

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
