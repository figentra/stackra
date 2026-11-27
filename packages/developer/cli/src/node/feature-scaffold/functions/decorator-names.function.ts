/**
 * Stackra file contract:
 * Purpose: `decoratorNames(fields)`, the decorator names the fields are written with (`Int`, `Str`), sorted and once
 *          each, for the import line of a scaffolded model or schema.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R4).
 */
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";

/**
 * The decorator names of `fields`.
 *
 * @example
 * decoratorNames(parseFields("title:string,count:int")); // ["Int", "Str"]
 */
export function decoratorNames(fields: readonly FeatureField[]): string[] {
  return [
    ...new Set(
      fields.flatMap((field) =>
        field.decorators.map((decorator) => /^@(\w+)/.exec(decorator)?.[1] ?? ""),
      ),
    ),
  ]
    .filter(Boolean)
    .toSorted();
}
