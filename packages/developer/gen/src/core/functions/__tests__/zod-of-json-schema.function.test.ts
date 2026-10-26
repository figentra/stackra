/**
 * Stackra file contract:
 * Purpose: unit tests of `zodOfJsonSchema`: each JSON Schema `jsonSchemaOf` writes prints back as the zod helper the
 *          producer uses (public ids, dates, money, records, nullable, optional and defaulted fields, unions), a local
 *          `$ref` prints the caller's name, and an unknown schema decodes as `json()`.
 * Boundary: test only; asserts on the printed source and the recorded imports.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0260 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { zodOfJsonSchema } from "#core/functions/zod-of-json-schema.function";

/** Prints `schema`, returning the source and the imports it recorded. */
function print(schema: Record<string, unknown>): { source: string; imports: string[] } {
  const imports: string[] = [];
  const source = zodOfJsonSchema(schema, {
    use: (from, name) => imports.push(`${from}#${name}`),
    ref: (target) => (target === "#/schemas/orders.OrderView" ? "OrderView$" : undefined),
  });
  return { source, imports };
}

describe("zodOfJsonSchema", () => {
  it("prints the platform helpers back", () => {
    expect(print({ type: "string", pattern: "^ord_[0-9A-Za-z]{26}$" })).toEqual({
      source: 'publicId("ord")',
      imports: ["@stackra/validation#publicId"],
    });
    expect(print({ type: "string", format: "date-time" }).source).toBe("isoDateTime()");
    expect(
      print({
        type: "object",
        required: ["minor", "currency"],
        properties: {
          minor: { type: "integer" },
          currency: { type: "string", pattern: "^[A-Z]{3}$" },
        },
      }).source,
    ).toBe("money()");
  });

  it("prints objects with required, optional and defaulted fields", () => {
    expect(
      print({
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          note: { type: ["string", "null"] },
        },
      }).source,
    ).toBe(
      'z.object({ "name": z.string().min(1), "limit": z.number().int().min(1).max(100).default(20), ' +
        '"note": z.string().nullable().optional() })',
    );
  });

  it("prints refs, arrays, records, enums and unions", () => {
    expect(print({ type: "array", items: { $ref: "#/schemas/orders.OrderView" } }).source).toBe(
      "z.array(OrderView$)",
    );
    expect(print({ type: "object", additionalProperties: { type: "boolean" } }).source).toBe(
      "z.record(z.string(), z.boolean())",
    );
    expect(print({ type: "string", enum: ["a", "b"] }).source).toBe('z.enum(["a","b"])');
    expect(
      print({
        oneOf: [{ $ref: "#/schemas/orders.OrderView" }],
        discriminator: { propertyName: "kind" },
      }).source,
    ).toBe('z.discriminatedUnion("kind", [OrderView$])');
    expect(print({ anyOf: [{ type: "boolean" }, { type: "null" }] }).source).toBe(
      "z.boolean().nullable()",
    );
  });

  it("decodes what it cannot read as json()", () => {
    expect(print({})).toEqual({ source: "json()", imports: ["@stackra/validation#json"] });
    expect(print({ $ref: "@acme/kit#/schemas/kit.X" }).source).toBe("json()");
  });
});
