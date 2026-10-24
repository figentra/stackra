/**
 * Stackra file contract:
 * Purpose: unit tests of `jsonSchemaOf`: required fields, rules as JSON Schema keywords, `$ref`s to enums and shapes,
 *          nullable fields, defaults as wire values, and a member base's fields flattened in.
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10 and 26); ADR 0158.
 */
import { describe, expect, it } from "@stackra/testing";

import { jsonSchemaOf } from "#core/functions/json-schema-of.function";
import type { ShapeIR } from "#core/types/shape-ir.type";
import { COMMERCE_IR } from "#core/__tests__/fixtures/commerce-ir.fixture";

/** The fixture shape named `name`. */
function shape(name: string): ShapeIR {
  const found = COMMERCE_IR.shapes.find((candidate) => candidate.name === name);
  if (found === undefined) throw new Error(`no fixture shape ${name}`);
  return found;
}

describe("jsonSchemaOf", () => {
  it("describes fields, rules and defaults", () => {
    expect(jsonSchemaOf(shape("ListOrdersInput"), COMMERCE_IR.shapes)).toEqual({
      type: "object",
      properties: {
        cursor: { type: "string" },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
    });
  });

  it("refers to enums and shapes and marks nullable fields", () => {
    expect(jsonSchemaOf(shape("CancelOrderOutput"), COMMERCE_IR.shapes)).toEqual({
      type: "object",
      required: ["status"],
      properties: { status: { $ref: "#/schemas/orders.OrderStatus" } },
    });
    const view = jsonSchemaOf(shape("OrderView"), COMMERCE_IR.shapes) as {
      properties: Record<string, unknown>;
    };
    expect(view.properties["placedAt"]).toEqual({ type: ["string", "null"], format: "date-time" });
    expect(view.properties["id"]).toEqual({ type: "string", pattern: "^ord_[0-9A-Za-z]{26}$" });
    expect(view.properties["note"]).toEqual({
      type: "string",
      maxLength: 500,
      pattern: "^[^<>]*$",
    });
  });

  it("flattens a member base", () => {
    const draft: ShapeIR = {
      ...shape("OrderView"),
      name: "DraftOrderView",
      base: { kind: "member", name: "OrderView", module: "orders" },
      fields: [
        { name: "draft", optional: false, nullable: false, type: { kind: "boolean" }, rules: [] },
      ],
    };
    const schema = jsonSchemaOf(draft, COMMERCE_IR.shapes) as { required: string[] };
    expect(schema.required).toEqual(["id", "total", "placedAt", "draft"]);
  });
});
