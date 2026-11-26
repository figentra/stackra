/**
 * Stackra file contract:
 * Purpose: `CodeScan`, what `emittedCodes` finds in a tool's source: each code with the files that emit it, and the
 *          code expressions it could not follow to a string literal.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 22: a refusal names its code and fix);
 *                     ADR 0282 (decision 3: `stackra check`); ADR 0296 (runway enforcement); STA-2853.
 */

/** The codes found in a tool's source. */
export interface CodeScan {
  /** Each code and the source files (relative to the scanned folder) that emit it. */
  readonly codes: ReadonlyMap<string, readonly string[]>;

  /** The code expressions that could not be followed to a string literal, as `file: expression`. */
  readonly unresolved: readonly string[];
}
