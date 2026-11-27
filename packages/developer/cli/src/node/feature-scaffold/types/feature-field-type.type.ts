/**
 * Stackra file contract:
 * Purpose: `FeatureFieldType`, one type `--fields` accepts: the TypeScript type of the property, the validation decorator
 *          written above it, and the Blueprint call of its column.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0294 (rule R4: shapes are type-first, decorators only refine); ADR 0159 (the Blueprint).
 */

/** One `--fields` type. */
export type FeatureFieldType = {
  /** The TypeScript type of the property. */
  readonly ts: string;

  /** The decorator above the property, or none when the type says it all. */
  readonly decorator?: string;

  /** The Blueprint call for a column named `column`. */
  readonly blueprint: (column: string) => string;
};
