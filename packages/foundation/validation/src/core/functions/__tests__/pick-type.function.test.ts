/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PickType`: the derived class has only the picked data fields (no methods), records
 *          its base and keys, refuses a key that is not a data field, and its subclass validates and creates through
 *          its own registered schema (the template's quick-order form).
 * Boundary: test only; registers the subclass's schema the way a generated schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (amendment item
 *                     13).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { Schema } from "#core/bases/schema.base";
import { Int } from "#core/decorators/int.decorator";
import { List } from "#core/decorators/list.decorator";
import { PickType } from "#core/functions/pick-type.function";
import { registerSchemas } from "#core/functions/register-schemas.function";
import { validate } from "#core/functions/validate.function";
import type { Fields } from "#core/types/fields.type";

class Line extends Schema {
  variantId!: string;

  quantity = 1;
}

class CreateOrderInput extends Schema {
  @List({ min: 1 })
  lines!: Line[];

  extensions: Record<string, unknown> = {};

  describe(): string {
    return `${this.lines.length} lines`;
  }
}

class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) {
  @Int({ min: 0 })
  redeemPoints = 0;

  static toInput(values: QuickOrderForm): Fields<CreateOrderInput> {
    return { lines: values.lines, extensions: {} };
  }
}

registerSchemas([
  [
    QuickOrderForm,
    z.object({
      lines: z.array(z.object({ variantId: z.string(), quantity: z.number().int() })).min(1),
      redeemPoints: z.number().int().min(0).default(0),
    }),
  ],
]);

const LINE = { variantId: "var_01JA0000000000000000000001", quantity: 2 };

describe("PickType", () => {
  it("types the picked data fields only", () => {
    expectTypeOf<Fields<QuickOrderForm>>().toEqualTypeOf<{
      lines: Fields<Line>[];
      redeemPoints: number;
    }>();
    // @ts-expect-error -- `describe` is a method, not a data field
    PickType(CreateOrderInput, ["describe"]);
    // @ts-expect-error -- not a field of CreateOrderInput
    PickType(CreateOrderInput, ["missing"]);
  });

  it("derives a Schema subclass that records its base and keys", () => {
    const Base = Object.getPrototypeOf(QuickOrderForm) as object;
    expect(Object.getPrototypeOf(Base)).toBe(Schema);
    expect(kindOf(QuickOrderForm)).toEqual({
      kind: "schema",
      options: { base: CreateOrderInput, pick: ["lines"] },
    });
    expect((Base as { name: string }).name).toBe("PickType(CreateOrderInput)");
  });

  it("validates and creates through the subclass's own schema", () => {
    expect(validate(QuickOrderForm, { lines: [] }).success).toBe(false);
    const parsed = validate(QuickOrderForm, { lines: [LINE] });
    expect(parsed.success && parsed.data).toEqual({ lines: [LINE], redeemPoints: 0 });
    const form = QuickOrderForm.create({ lines: [LINE], redeemPoints: 250 });
    expect(form).toBeInstanceOf(QuickOrderForm);
    expect(QuickOrderForm.toInput(form)).toEqual({ lines: [LINE], extensions: {} });
  });
});
