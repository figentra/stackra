/**
 * Stackra file contract:
 * Purpose: `inspectorFieldsOf(schema)`, the block inspector's field list: it reads a block's zod props schema and
 *          describes each prop the inspector can edit (key, label, kind, required, options).
 * Boundary: a pure function reading the schema's structure only. Optional, nullable, default and readonly wrappers are
 *           looked through; a `{ minor, currency }` object or codec (`money()`) is `money`, a record of strings is
 *           `localized`. A prop of any other shape (a list, a nested object) is left out, and a schema that is not an
 *           object yields no fields. `required` is whether the schema refuses `undefined`.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 4: the block inspector); ADR 0110 (decision 1: validated props); ADR 0294
 *                     (decision 26: one zod schema per shape).
 */
import type { ZodType } from "zod";
import { z } from "zod";

import { InspectorFieldKind, type InspectorField } from "#contracts/index";

/** The kind and enum options of a prop schema, or `undefined` for a shape the inspector does not edit. */
function describeProp(schema: unknown): Pick<InspectorField, "kind" | "options"> | undefined {
  const isMoney = (object: z.ZodObject): boolean =>
    "minor" in object.shape && "currency" in object.shape;
  let current = schema;
  for (;;) {
    // By definition type: `z.email()` and `z.url()` are strings that are not `ZodString` instances.
    const type = (
      current as { readonly _zod?: { readonly def?: { readonly type?: string } } } | null
    )?._zod?.def?.type;
    if (type === "string") return { kind: InspectorFieldKind.Text, options: [] };
    if (type === "number") return { kind: InspectorFieldKind.Number, options: [] };
    if (type === "boolean") return { kind: InspectorFieldKind.Boolean, options: [] };
    if (current instanceof z.ZodEnum) {
      const options: readonly unknown[] = current.options;
      return options.every((option) => typeof option === "string")
        ? { kind: InspectorFieldKind.Enum, options: options as readonly string[] }
        : undefined;
    }
    if (current instanceof z.ZodRecord)
      return current.keyType instanceof z.ZodString && current.valueType instanceof z.ZodString
        ? { kind: InspectorFieldKind.Localized, options: [] }
        : undefined;
    if (current instanceof z.ZodObject)
      return isMoney(current) ? { kind: InspectorFieldKind.Money, options: [] } : undefined;
    // The `money()` codec: a pipe whose wire side is the `{ minor, currency }` object.
    if (current instanceof z.ZodPipe)
      return current.in instanceof z.ZodObject && isMoney(current.in)
        ? { kind: InspectorFieldKind.Money, options: [] }
        : undefined;
    // Optional, nullable, default, readonly and catch expose their inner schema as `unwrap()`.
    const unwrap = (current as { readonly unwrap?: () => unknown } | null)?.unwrap;
    if (typeof unwrap !== "function") return undefined;
    current = unwrap.call(current);
  }
}

/** The key as words: `heroTitle` and `hero_title` read `Hero title`. */
function labelOf(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The editable props of `schema`, in schema order.
 *
 * @example
 * inspectorFieldsOf(z.object({ title: z.record(z.string(), z.string()), tone: z.enum(["calm", "bold"]).optional() }));
 * // [{ key: "title", label: "Title", kind: "localized", required: true, options: [] },
 * //  { key: "tone", label: "Tone", kind: "enum", required: false, options: ["calm", "bold"] }]
 */
export function inspectorFieldsOf(schema: ZodType): readonly InspectorField[] {
  if (!(schema instanceof z.ZodObject)) return [];
  const fields: InspectorField[] = [];
  for (const [key, prop] of Object.entries(schema.shape as Readonly<Record<string, ZodType>>)) {
    const described = describeProp(prop);
    if (described === undefined) continue;
    fields.push({
      key,
      label: prop.meta()?.title ?? labelOf(key),
      required: !prop.safeParse(undefined).success,
      ...described,
    });
  }
  return fields;
}
