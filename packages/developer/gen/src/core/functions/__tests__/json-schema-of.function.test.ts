/**
 * Stackra file contract:
 * Purpose: unit tests of `jsonSchemaOf`: required fields, rules as JSON Schema keywords, `$ref`s to enums and shapes,
 *          nullable fields, defaults as wire values, a member base's fields flattened in, and the translated and
 *          upload kinds (STA-1218); a shipped `X$` as
 *          `x-stackra-schema` (STA-1290).
 * Boundary: test only; runs on the commerce IR fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 10 and 26); ADR 0158; ADR 0162; ADR 0222.
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

  it("describes a translated field as a locale map and an upload as its token", () => {
    const listing: ShapeIR = {
      name: "Listing",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/listing.schema.ts",
      importPath: "#modules/orders/schemas/listing.schema",
      fields: [
        {
          name: "title",
          optional: false,
          nullable: false,
          type: { kind: "translated", form: "value" },
          rules: [{ name: "Str", options: { max: 200 } }],
        },
        {
          name: "description",
          optional: false,
          nullable: true,
          type: { kind: "translated", form: "value" },
          rules: [],
        },
        {
          name: "label",
          optional: false,
          nullable: false,
          type: { kind: "translated", form: "strings" },
          rules: [],
        },
        {
          name: "photo",
          optional: false,
          nullable: false,
          type: { kind: "upload", bucket: "PhotosBucket" },
          rules: [],
        },
      ],
      relations: [],
    };
    const schema = jsonSchemaOf(listing, COMMERCE_IR.shapes) as {
      properties: Record<string, unknown>;
    };
    expect(schema.properties["title"]).toEqual({
      type: "object",
      additionalProperties: { type: "string", maxLength: 200 },
      "x-stackra-type": "translated",
    });
    expect(schema.properties["description"]).toEqual({
      type: ["object", "null"],
      additionalProperties: { type: "string" },
      "x-stackra-type": "translated",
    });
    expect(schema.properties["label"]).toEqual({
      type: "object",
      additionalProperties: { type: "string" },
      "x-stackra-type": "translated",
    });
    expect(schema.properties["photo"]).toEqual({
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", pattern: "^upl_[0-9A-Za-z]{26}$" } },
      "x-stackra-type": "upload",
      "x-stackra-bucket": "PhotosBucket",
    });
  });

  it("describes a bare public id with any prefix and a prefix union", () => {
    const refs: ShapeIR = {
      name: "Refs",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/refs.schema.ts",
      importPath: "#modules/orders/schemas/refs.schema",
      fields: [
        {
          name: "principalId",
          optional: false,
          nullable: false,
          type: { kind: "public_id", prefix: "" },
          rules: [],
        },
        {
          name: "listId",
          optional: false,
          nullable: false,
          type: { kind: "public_id", prefix: "", prefixes: ["crl", "prl"] },
          rules: [],
        },
      ],
      relations: [],
    };
    const schema = jsonSchemaOf(refs, COMMERCE_IR.shapes) as {
      properties: Record<string, unknown>;
    };
    expect(schema.properties["principalId"]).toEqual({
      type: "string",
      pattern: "^[a-z]{2,6}_[0-9A-Za-z]{26}$",
    });
    expect(schema.properties["listId"]).toEqual({
      type: "string",
      pattern: "^(crl|prl)_[0-9A-Za-z]{26}$",
    });
  });

  it("references a package's shipped schema instead of describing it again (STA-1290)", () => {
    const site: ShapeIR = {
      name: "Site",
      kind: "schema",
      module: "orders",
      file: "src/modules/orders/schemas/site.schema.ts",
      importPath: "#modules/orders/schemas/site.schema",
      fields: [
        {
          name: "address",
          optional: false,
          nullable: false,
          type: { kind: "shipped", name: "Address", from: "@stackra/validation" },
          rules: [],
        },
        {
          name: "audience",
          optional: false,
          nullable: true,
          type: { kind: "shipped", name: "Audience", from: "@stackra/iam/contracts" },
          rules: [],
        },
      ],
      relations: [],
    };
    const schema = jsonSchemaOf(site, COMMERCE_IR.shapes) as {
      properties: Record<string, unknown>;
    };
    expect(schema.properties["address"]).toEqual({
      "x-stackra-schema": "@stackra/validation#Address$",
    });
    expect(schema.properties["audience"]).toEqual({
      anyOf: [{ "x-stackra-schema": "@stackra/iam/contracts#Audience$" }, { type: "null" }],
    });
  });
});
