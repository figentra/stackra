/**
 * Stackra file contract:
 * Purpose: unit tests of `inspectorFieldsOf`: each prop kind (text, number, boolean, enum, money by object and by
 *          codec, localized), required against optional and default, labels from the key and from `title` metadata,
 *          and the props and schemas it leaves out.
 * Boundary: test only; plain zod schemas.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0270 (decision 4: the block inspector).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { inspectorFieldsOf } from "#core/functions/inspector-fields-of.function";

describe("inspectorFieldsOf", () => {
  it("describes each kind, in schema order", () => {
    const fields = inspectorFieldsOf(
      z.object({
        heroTitle: z.record(z.string(), z.string()),
        link: z.url().optional(),
        columns: z.int().default(3),
        dark: z.boolean().nullable(),
        tone: z.enum(["calm", "bold"]),
        price: z.object({ minor: z.int(), currency: z.string() }),
        total: z.codec(
          z.object({ minor: z.int(), currency: z.string() }),
          z.custom<{ minor: number }>(),
          { decode: (wire) => wire, encode: (value) => ({ ...value, currency: "USD" }) },
        ),
      }),
    );
    expect(fields).toEqual([
      { key: "heroTitle", label: "Hero title", kind: "localized", required: true, options: [] },
      { key: "link", label: "Link", kind: "text", required: false, options: [] },
      { key: "columns", label: "Columns", kind: "number", required: false, options: [] },
      { key: "dark", label: "Dark", kind: "boolean", required: true, options: [] },
      { key: "tone", label: "Tone", kind: "enum", required: true, options: ["calm", "bold"] },
      { key: "price", label: "Price", kind: "money", required: true, options: [] },
      { key: "total", label: "Total", kind: "money", required: true, options: [] },
    ]);
  });

  it("prefers the schema's title for the label", () => {
    const [field] = inspectorFieldsOf(z.object({ cta: z.string().meta({ title: "Button text" }) }));
    expect(field?.label).toBe("Button text");
  });

  it("leaves out props it cannot edit and schemas that are not objects", () => {
    expect(
      inspectorFieldsOf(
        z.object({
          items: z.array(z.string()),
          nested: z.object({ a: z.string() }),
          level: z.enum({ Low: 1, High: 2 }),
          name: z.string(),
        }),
      ).map((field) => field.key),
    ).toEqual(["name"]);
    expect(inspectorFieldsOf(z.string())).toEqual([]);
  });
});
