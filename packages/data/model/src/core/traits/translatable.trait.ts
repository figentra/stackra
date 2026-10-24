/**
 * Stackra file contract:
 * Purpose: `Translatable(fields)`, the trait that names the model's per-locale fields: each is typed `Translated`
 *          (one value per locale, read with `.in(locale)`) and stored as one jsonb column.
 * Boundary: adds no field (the model declares each `Translated` field itself, with its constraints); it records the
 *           field names in the trait registry, which gen checks against the fields typed `Translated`. The fallback
 *           chain is `Translated#in`.
 * Runtime: isomorphic
 * Governing contract: ADR 0162 (decision 2: per-locale storage and the fallback chain in @stackra/model); ADR 0096.
 */
import { createTrait } from "#core/functions/create-trait.function";
import type { Trait } from "#core/types/trait.type";

/**
 * The translatable trait over `fields`.
 *
 * @param fields - the names of the model's `Translated` fields, at least one, each once.
 * @throws TypeError when `fields` is empty or names a field twice.
 * @example
 * export class Product extends Model.with(HasPublicId("prd"), Translatable(["title", "description"])) {
 *   @Str({ max: 200 })
 *   title!: Translated;
 *
 *   description: Translated | null = null;
 * }
 */
export function Translatable(fields: readonly string[]): Trait {
  if (fields.length === 0) throw new TypeError("Translatable needs at least one field");
  if (new Set(fields).size !== fields.length)
    throw new TypeError(`Translatable names a field twice: ${fields.join(", ")}`);
  return createTrait("translatable", (base) => class extends base {}, {
    fields: Object.freeze([...fields]),
  });
}
