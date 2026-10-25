/**
 * Stackra file contract:
 * Purpose: `TranslatedStrings`, the structural shape of a per-locale text value (`@stackra/model`'s `Translated`), so
 *          `@Str` type-checks on a translated field and constrains each locale's string.
 * Boundary: a type only. Written structurally because validation sits below model and never imports it.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 6: each field decorator is typed against its field).
 */

/**
 * A text value with one string per locale tag; `@Str` applies its rules to each one.
 *
 * @example
 * ```ts
 * @Str({ max: 120 })
 * title!: Translated; // satisfies TranslatedStrings
 * ```
 */
export interface TranslatedStrings {
  /** The value per locale tag. */
  readonly values: Readonly<Record<string, string>>;
}
