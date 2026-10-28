/**
 * Stackra file contract:
 * Purpose: `SettingsRules<T>`, the rule builder `rules(r)` receives on a settings class: the closed set of cross-field
 *          comparisons, each typed to the number paths of `T` (a top-level number field, or a number field of a
 *          section), so a typo or a boolean path fails the type check.
 * Boundary: a type only. Gen reads the calls in `rules(r)` from the syntax tree, refuses any other, and compiles each
 *           into the group's schema and the generated settings, so the form and the save check the same rules; no
 *           builder runs at run time.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 22: `rules(r)` is a closed set); ADR 0294 (decision 26: the shape compiler).
 */
import type { Fields } from "@stackra/validation";

import type { SettingsRule } from "#core/types/settings-rule.type";

/** The names of the number fields of `T`. */
type NumberKeys<T> = {
  [K in keyof T & string]: T[K] extends number | null ? K : never;
}[keyof T & string];

/** The number paths of the settings class `T`: a number field, or `<section>.<number field>` one level deep. */
type NumberPath<T> = {
  [K in keyof Fields<T> & string]: Fields<T>[K] extends number | null
    ? K
    : Fields<T>[K] extends object
      ? `${K}.${NumberKeys<Fields<T>[K]>}`
      : never;
}[keyof Fields<T> & string];

/**
 * The comparisons a settings class may declare.
 *
 * @example
 * override rules(r: SettingsRules<LoyaltyKitSettings>) {
 *   return [r.lessThan("tiers.silverFrom", "tiers.goldFrom")];
 * }
 */
export interface SettingsRules<T> {
  /** `a` stays below `b`. */
  lessThan: (a: NumberPath<T>, b: NumberPath<T>) => SettingsRule;

  /** `a` stays at or below `b`. */
  atMost: (a: NumberPath<T>, b: NumberPath<T>) => SettingsRule;

  /** `a` stays above `b`. */
  greaterThan: (a: NumberPath<T>, b: NumberPath<T>) => SettingsRule;

  /** `a` stays at or above `b`. */
  atLeast: (a: NumberPath<T>, b: NumberPath<T>) => SettingsRule;
}
