/**
 * Stackra file contract:
 * Purpose: `localizeValue`, which walks parsed props beside the schema that parsed them and replaces every
 *          `LocalizedText` (a record of strings keyed by string) with its string in the locale, through nested
 *          objects, lists, records, unions and wrappers.
 * Boundary: reads the schema's structure only; the value must already have passed that schema. A union picks the first
 *           option the value parses with. A schema kind it does not look into (a custom, a pipe) keeps its value as
 *           parsed. Internal: not exported from an entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 1); ADR 0294 (decision 26: one zod schema per shape); ADR 0162 (decision 2).
 */
import { z } from "zod";

import { textIn } from "#core/functions/text-in.function";
import type { LocalizedText } from "#core/types/localized-text.type";

/** Each entry of `record` with `map` applied to its value. */
const mapEntries = (
  record: Readonly<Record<string, unknown>>,
  map: (key: string, item: unknown) => unknown,
): Record<string, unknown> =>
  Object.fromEntries(Object.entries(record).map(([key, item]) => [key, map(key, item)]));

/**
 * `value` with every `LocalizedText` that `schema` declares read in `locale`.
 *
 * @param schema - the schema `value` passed (the block's generated schema, or a part of it).
 * @example
 * localizeValue(z.object({ title: z.record(z.string(), z.string()) }), { title: { en: "Hi", ar: "مرحبا" } }, "ar");
 * // { title: "مرحبا" }
 */
export function localizeValue(schema: unknown, value: unknown, locale: string): unknown {
  if (value === null || value === undefined) return value;
  if (schema instanceof z.ZodRecord) {
    if (schema.keyType instanceof z.ZodString && schema.valueType instanceof z.ZodString)
      return textIn(value as LocalizedText, locale);
    return mapEntries(value as Readonly<Record<string, unknown>>, (_key, item) =>
      localizeValue(schema.valueType, item, locale),
    );
  }
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Readonly<Record<string, unknown>>;
    return mapEntries(value as Readonly<Record<string, unknown>>, (key, item) =>
      Object.hasOwn(shape, key) ? localizeValue(shape[key], item, locale) : item,
    );
  }
  if (schema instanceof z.ZodArray)
    return (value as readonly unknown[]).map((item) => localizeValue(schema.element, item, locale));
  if (schema instanceof z.ZodUnion) {
    const match = schema.options.find((option) => z.safeParse(option, value).success);
    return match === undefined ? value : localizeValue(match, value, locale);
  }
  // Optional, nullable, default, readonly, catch and lazy all expose their inner schema as `unwrap()`.
  const unwrap = (schema as { readonly unwrap?: () => unknown } | null)?.unwrap;
  return typeof unwrap === "function" ? localizeValue(unwrap.call(schema), value, locale) : value;
}
