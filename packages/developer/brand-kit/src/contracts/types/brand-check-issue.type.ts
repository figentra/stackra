/**
 * Stackra file contract:
 * Purpose: `BrandCheckIssue`, one problem `--check` found (a missing kit file, a drifted output, a live `<text>` in a
 *          logo).
 * Boundary: a type in the leaf entry. Codes are snake_case and stated by the generator.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended); ADR 0231 (snake_case codes).
 */

/**
 * One check problem.
 *
 * @example
 * const issue: BrandCheckIssue = { code: "missing_file", path: "logos/horizontal.svg", message: "required by the checklist" };
 */
export interface BrandCheckIssue {
  /** Stable snake_case code. */
  readonly code: string;

  /** The kit or output path concerned. */
  readonly path: string;

  /** A human-readable detail of the issue. */
  readonly message: string;
}
