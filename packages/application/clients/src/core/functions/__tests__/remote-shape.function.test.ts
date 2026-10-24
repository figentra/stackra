/**
 * Stackra file contract:
 * Purpose: unit and type tests of `remoteShape`: the shape name and schema statics, `nullable`, `create` on the class
 *          and on a form that extends it, the `schema` kind record, the refused name, and the types the template
 *          relies on (a decoded answer is the shape, `PickType` takes it, a union shape still extends).
 * Boundary: test only; the shapes restate the template's generated `#stackra/clients/commerce` and `experience`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0260 (decision 2); ADR 0095 (shapes); owner decision R-04.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { PickType, publicId } from "@stackra/validation";
import type { output } from "zod";
import { z } from "zod";

import { remoteShape } from "#core/functions/remote-shape.function";

const VARIANT_ID = "var_01h2j3k4m5n6p7q8r9s0t1v2w3";

const RequestedLine$ = z.object({ variantId: publicId("var"), quantity: z.number().int().min(1) });

class RequestedLine extends remoteShape("orders.RequestedLine", RequestedLine$) {}

/** A form over the action's own line, as `apps/mobile/src/schemas/create-order-form.schema.ts` writes it. */
class CreateOrderForm extends RequestedLine {
  redeemPoints = 0;
}

class CreateOrderInput extends remoteShape(
  "orders.CreateOrderInput",
  z.object({ lines: z.array(RequestedLine$), note: z.string().default("") }),
) {}

class GetDocumentInput extends remoteShape(
  "experience.GetDocumentInput",
  z.union([z.object({ key: z.string() }), z.object({ path: z.string() })]),
) {}

describe("remoteShape", () => {
  it("carries the shape name and its schema", () => {
    expect(RequestedLine.shapeName).toBe("orders.RequestedLine");
    expect(RequestedLine.schema).toBe(RequestedLine$);
  });

  it("gives the schema or null", () => {
    expect(RequestedLine.nullable().parse(null)).toBeNull();
    expect(RequestedLine.nullable().safeParse({ variantId: VARIANT_ID, quantity: 0 }).success).toBe(
      false,
    );
  });

  it("creates an instance parsed by its schema", () => {
    const line = RequestedLine.create({ variantId: VARIANT_ID, quantity: 2 });
    expect(line).toBeInstanceOf(RequestedLine);
    expect({ ...line }).toEqual({ variantId: VARIANT_ID, quantity: 2 });
    expect(() => RequestedLine.create({ variantId: VARIANT_ID, quantity: 0 })).toThrow();
  });

  it("creates a form that extends it, keeping the form's own initializers", () => {
    const form = CreateOrderForm.create({ variantId: VARIANT_ID, quantity: 1 });
    expect(form).toBeInstanceOf(CreateOrderForm);
    expect(form.redeemPoints).toBe(0);
    expect(form.quantity).toBe(1);
  });

  it("is recorded as the schema kind with its remote name", () => {
    expect(kindOf(CreateOrderInput)).toEqual({
      kind: "schema",
      options: { remote: "orders.CreateOrderInput" },
    });
  });

  it("refuses a name that is not <module>.<PascalName>", () => {
    expect(() => remoteShape("orders.requested_line", RequestedLine$)).toThrow(RangeError);
  });

  it("types an instance as the schema's output, so a decoded answer is the shape", () => {
    const decoded: output<typeof RequestedLine$> = { variantId: VARIANT_ID, quantity: 1 } as never;
    const line: RequestedLine = decoded;
    expectTypeOf(line.quantity).toEqualTypeOf<number>();
    expectTypeOf<CreateOrderForm["redeemPoints"]>().toEqualTypeOf<number>();
  });

  it("takes part in PickType and extends over a union", () => {
    class QuickOrderForm extends PickType(CreateOrderInput, ["lines"]) {}
    expectTypeOf<QuickOrderForm["lines"]>().toEqualTypeOf<output<typeof RequestedLine$>[]>();
    // A union shape still declares a class; either member of the union is one of its values.
    const byKey: GetDocumentInput = { key: "welcome" };
    expectTypeOf(byKey).toExtend<object>();
  });
});
