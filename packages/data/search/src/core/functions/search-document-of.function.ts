/**
 * Stackra file contract:
 * Purpose: `searchDocumentOf`, the document of one loaded row: the normalised words of each `@Searchable` text field
 *          (one string per locale for a translated field), the values of each filter field, and the row's scope.
 * Boundary: pure over the row it is given. A path walks the row's own fields and its populated relations: a collection
 *           or array spreads into its items, a reference unwraps. A `Translated` field gives one text per stored
 *           locale (`.in(locale)` for each value, so a value missing a locale falls back as it reads); a field the
 *           model's `Translatable` trait names counts as translated even while it still holds the plain locale map a
 *           factory gave it. A rich-text value gives its `text` leaves. Filters keep strings, numbers and booleans, and
 *           a date as its ISO 8601 string; other values are not filterable and are left out. The scope is the row's own
 *           `scopeId` and `scopePath` when both are strings, else absent.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decisions 1 to 3); ADR 0162 (decision 2: per-locale values); ADR 0294 (decision 6);
 *                     ADR 0089 (decision 6); ADR 0327 (a scope is an id and an `ltree` path).
 */
import type { PublicId } from "@stackra/contracts";
import { Collection, Translated, traitsOf } from "@stackra/model";
import type { SearchableOptions } from "@stackra/model";

import type { SearchDocument, SearchFilterValue } from "#contracts/index";
import { searchWordsOf } from "#core/functions/search-words-of.function";

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

/** The values at the dotted `path` on `row`. */
function valuesAt(row: object, path: string): readonly unknown[] {
  let values: readonly unknown[] = [row];
  for (const key of path.split("."))
    values = values.flatMap((value) =>
      typeof value === "object" && value !== null ? spread(fieldOf(value, key)) : [],
    );
  return values;
}

/** The text of one non-translated value; a rich-text document gives its `text` leaves. */
function stringsOf(value: unknown): readonly string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean")
    return [String(value)];
  if (value instanceof Date) return [value.toISOString()];
  if (typeof value !== "object" || value === null) return [];
  // shortcut: a rich-text document (L2) gives the strings under its `text` keys, at any depth; read it through the
  // document package's plain-text function once that ships.
  return Object.entries(value).flatMap(([key, inner]) =>
    key === "text" && typeof inner === "string"
      ? [inner]
      : typeof inner === "object"
        ? stringsOf(inner)
        : [],
  );
}

/** The normalised words of `texts`, joined by single spaces. */
const wordsOf = (texts: readonly string[]): string => searchWordsOf(texts.join(" ")).join(" ");

/** The text of one field's values: one string, or one per locale when a value is translated. */
function textOf(values: readonly unknown[]): string | Readonly<Record<string, string>> {
  const translated = values.filter((value): value is Translated => value instanceof Translated);
  const plain = values.filter((value) => !(value instanceof Translated)).flatMap(stringsOf);
  if (translated.length === 0) return wordsOf(plain);
  const locales = [...new Set(translated.flatMap((value) => Object.keys(value.values)))];
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      wordsOf([...translated.map((value) => value.in(locale)), ...plain]),
    ]),
  );
}

/** The filterable values among `values`. */
function filterValuesOf(values: readonly unknown[]): readonly SearchFilterValue[] {
  return values.flatMap((value): SearchFilterValue[] => {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
      return [value];
    return value instanceof Date ? [value.toISOString()] : [];
  });
}

/**
 * The document of `row`.
 *
 * @param row - a loaded row whose relations on the facet's paths are populated.
 * @param id - the row's primary key.
 * @param facet - the model's `@Searchable` options.
 * @throws TypeError when a relation on a path was not populated, or a translated field holds a bad locale map.
 * @example
 * searchDocumentOf(product, product.id, Searchable.on(Product));
 * // { id: "prd_…", fields: [{ en: "linen shirt", ar: "قميص كتان" }, "sku 1"], filters: { status: ["active"] } }
 */
export function searchDocumentOf(
  row: object,
  id: string,
  facet: SearchableOptions,
): SearchDocument {
  const { scopeId, scopePath } = row as {
    readonly scopeId?: unknown;
    readonly scopePath?: unknown;
  };
  return {
    id,
    fields: facet.text.map((path) => textOf(valuesAt(row, path))),
    filters: Object.fromEntries(
      (facet.filters ?? []).map((path) => [path, filterValuesOf(valuesAt(row, path))]),
    ),
    ...(typeof scopeId === "string" && typeof scopePath === "string"
      ? { scope: { id: scopeId as PublicId<"scp">, path: scopePath } }
      : {}),
  };
}
