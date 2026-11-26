/**
 * Stackra file contract:
 * Purpose: `ModelFacts`, what `stackra new action` and `stackra new query` read back from a model file: its class,
 *          its public id prefix, its own fields and where each decorator of those fields is imported from.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 20: model keys); ADR 0135 (public id prefixes).
 */
import type { FeatureField } from "#node/feature-scaffold/types/feature-field.type";

/** One model as its file declares it. */
export type ModelFacts = {
  /** The class name (`OrderLine`). */
  readonly className: string;

  /** The `HasPublicId` prefix (`orl`). */
  readonly prefix: string;

  /** The fields declared in the class body whose type is a string, number, boolean or Date (nullable or not). */
  readonly fields: readonly FeatureField[];

  /** Decorator name to the module it is imported from (`Str` to `@stackra/validation`). */
  readonly imports: ReadonlyMap<string, string>;
};
