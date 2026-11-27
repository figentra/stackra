/**
 * Stackra file contract:
 * Purpose: `FeatureResult`, what `scaffoldFeature` wrote (or, on a dry run, would write): the service, the new files,
 *          the files it changed and how, and the packages it declared.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */

/** The outcome of one feature scaffold. */
export type FeatureResult = {
  /** The service folder, absolute. */
  readonly member: string;

  /** The new files, relative to the service. */
  readonly created: readonly string[];

  /** The changed files, relative to the service, each with what changed. */
  readonly changed: readonly string[];

  /** The packages added to the service's package.json. */
  readonly dependencies: readonly string[];

  /** Lines for the developer: what is left to do by hand. */
  readonly notes: readonly string[];
};
