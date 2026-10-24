/**
 * Stackra file contract:
 * Purpose: `BuildFacts`, what the build itself tells the public env besides its variables: whether this is a
 *          development build, so code never reads `import.meta.env.DEV` or `NODE_ENV` itself.
 * Boundary: a type only; `hydrateEnv(..., { only: "public" })` derives it from the raw environment it is given.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decisions 2 and 10).
 */

/** Facts of the build. */
export interface BuildFacts {
  /** True in a development build (`DEV`, `MODE === "development"` or `NODE_ENV === "development"`). */
  readonly isDevelopment: boolean;
}
