/**
 * Stackra file contract:
 * Purpose: `FeatureField`, one field of a model, an input or a view that `stackra new model` and `stackra new
 *          migration` take from `--fields`, or that `stackra new action` reads back from a model: its property name,
 *          its column, its TypeScript type, whether it may be null, and the decorators written above it.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20: snake_case columns, camelCase properties); ADR 0159 (explicit
 *                     nullability and a comment per column).
 */

/** One field. */
export type FeatureField = {
  /** The camelCase property (`dueAt`). */
  readonly name: string;

  /** The snake_case column (`due_at`). */
  readonly column: string;

  /** The TypeScript type without `| null` (`string`, `number`, `boolean`, `Date`). */
  readonly type: string;

  /** True when the column is nullable and the property is `T | null`. */
  readonly nullable: boolean;

  /** The decorator lines written above the property, without indentation (`@Str({ max: 255 })`). */
  readonly decorators: readonly string[];

  /** The one-sentence doc comment of the property. */
  readonly doc: string;

  /** The Blueprint call that adds the column, without nullability or comment (`t.string("title", 255)`). */
  readonly blueprint?: string;
};
