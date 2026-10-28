/**
 * Stackra file contract:
 * Purpose: `searchValuesAt`, the values at a dotted `@Searchable` path of a loaded row: the row's own fields and its
 *          populated relations, a collection or array spread into its items and a reference unwrapped.
 * Boundary: pure over the row it is given; internal to this package. A field the model's `Translatable` trait names
 *           comes back as a `Translated`, even while it still holds the plain locale map a factory gave it.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 to 3); ADR 0162 (decision 2: per-locale values); ADR 0294 (decision 6).
 */
import { Collection, Translated, traitsOf } from "@stackra/model";

/** The field `key` of `owner`, as a `Translated` when the owner's model translates it. */
function fieldOf(owner: object, key: string): unknown {
  const value = (owner as Readonly<Record<string, unknown>>)[key];
  if (value === null || typeof value !== "object" || value instanceof Translated) return value;
  const fields = traitsOf(owner.constructor).find((trait) => trait.name === "translatable")
    ?.options["fields"];
  return Array.isArray(fields) && fields.includes(key)
    ? Translated.of(value as Readonly<Record<string, string>>)
    : value;
}

/** `value` as the items it stands for: a collection or array spreads, a reference unwraps, nothing is none. */
function spread(value: unknown): readonly unknown[] {
  if (value === null || value === undefined) return [];
  if (value instanceof Collection) return value.getItems();
  if (Array.isArray(value)) return value;
  const unwrap = (value as { readonly unwrap?: unknown }).unwrap;
  return typeof unwrap === "function" ? [unwrap.call(value)] : [value];
}

/**
 * The values at the dotted `path` on `row`.
 *
 * @throws TypeError when a relation on the path was not populated.
 * @example
 * searchValuesAt(product, "variants.sku"); // ["SKU-1", "SKU-2"]
 */
export function searchValuesAt(row: object, path: string): readonly unknown[] {
  let values: readonly unknown[] = [row];
  for (const key of path.split("."))
    values = values.flatMap((value) =>
      typeof value === "object" && value !== null ? spread(fieldOf(value, key)) : [],
    );
  return values;
}
