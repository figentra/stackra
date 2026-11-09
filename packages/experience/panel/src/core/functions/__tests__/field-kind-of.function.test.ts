/**
 * Stackra file contract:
 * Purpose: proves `fieldKindOf` draws each field from JSON Schema as `inputKind` draws it from zod (the parity that
 *          keeps a screen and the chat alike), and refines long text, several choices, money, record references and
 *          uploads; wrappers, `$ref`s and missing paths are handled.
 * Boundary: unit tier; pure functions, zod's own `toJSONSchema` for the parity.
 * Runtime: node
 * Governing contract: ADR 0307; Tamo spec generative-ui-tools-artifacts (G3)
 */
import { z } from "zod";

import { fieldKindOf } from "#core/functions/field-kind-of.function";
import { inputKind } from "#core/functions/input-kind.function";
import type { FieldKind } from "#core/types/field-kind.type";

/** The `InputKind` kind a `FieldKind` refines. */
const BASE: Readonly<Record<FieldKind["kind"], string>> = {
  text: "text",
  boolean: "boolean",
  date: "date",
  datetime: "datetime",
  json: "json",
  missing: "missing",
  number: "number",
  enum: "enum",
  multi_enum: "list",
  object: "object",
  list: "list",
  record: "record",
  longtext: "text",
  money: "number",
  file: "object",
  reference: "text",
};

/** An input with one field of each kind, as a product action declares it. */
const INPUT = z.object({
  name: z.string().max(80),
  note: z.string().max(4000).optional(),
  active: z.boolean(),
  day: z.iso.date(),
  at: z.iso.datetime().nullable(),
  data: z.json(),
  qty: z.number().int().min(1).max(99),
  totalMinor: z.number().int(),
  tier: z.enum(["bronze", "gold"]),
  tags: z.array(z.enum(["vip", "new"])),
  address: z.object({ city: z.string(), zip: z.string() }),
  lines: z.array(z.object({ sku: z.string() })),
  codes: z.array(z.string()),
  prices: z.record(z.string(), z.number()),
  labels: z.record(z.string(), z.string()),
  orderId: z.string().regex(/^ord_[0-9a-hjkmnp-tv-z]{26}$/i),
  image: z.object({ id: z.string().regex(/^upl_[0-9a-hjkmnp-tv-z]{26}$/i) }),
});

/** Field kinds from JSON Schema. */
describe("fieldKindOf", () => {
  it("gives every field the same base kind as inputKind gives it from zod", () => {
    const json = z.toJSONSchema(INPUT);
    for (const path of [...Object.keys(INPUT.shape), "address.city", "lines.0.sku", "nope"])
      expect([path, BASE[fieldKindOf(json, path).kind]]).toEqual([
        path,
        inputKind(INPUT, path).kind,
      ]);
  });

  it("refines long text, several choices, numbers' bounds, money, references and uploads", () => {
    const json = z.toJSONSchema(INPUT);

    expect(fieldKindOf(json, "note")).toEqual({ kind: "longtext" });
    expect(fieldKindOf(json, "tags")).toEqual({ kind: "multi_enum", options: ["vip", "new"] });
    expect(fieldKindOf(json, "qty")).toEqual({ kind: "number", min: 1, max: 99 });
    expect(fieldKindOf(json, "totalMinor")).toEqual({ kind: "money" });
    expect(fieldKindOf(json, "orderId")).toEqual({ kind: "reference", prefix: "ord" });
    expect(fieldKindOf(json, "image")).toEqual({ kind: "file" });
    expect(fieldKindOf(json, "tier")).toEqual({ kind: "enum", options: ["bronze", "gold"] });
  });

  it("follows a $ref through resolve and reads a missing path as missing", () => {
    const schemas: Readonly<Record<string, unknown>> = {
      "orders.Address": { type: "object", properties: { city: { type: "string" } } },
    };
    const input = { type: "object", properties: { address: { $ref: "#/schemas/orders.Address" } } };
    const resolve = (ref: string) => schemas[ref.replace("#/schemas/", "")];

    expect(fieldKindOf(input, "address", resolve)).toEqual({ kind: "object", keys: ["city"] });
    expect(fieldKindOf(input, "address.city", resolve)).toEqual({ kind: "text" });
    expect(fieldKindOf(input, "address")).toEqual({ kind: "json" });
    expect(fieldKindOf(undefined, "x")).toEqual({ kind: "missing" });
  });
});
