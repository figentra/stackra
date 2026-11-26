/**
 * Stackra file contract:
 * Purpose: `UpgradeFinding`, one place a person must change by hand after `stackra upgrade`: the codemod, the file,
 *          the line and column, the code there and what to do.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145.
 */

/** A manual step at one place in the source. */
export type UpgradeFinding = {
  /** The codemod id. */
  readonly codemod: string;

  /** The file, relative to the workspace root, with `/` separators. */
  readonly file: string;

  /** The line, from 1. */
  readonly line: number;

  /** The column, from 1. */
  readonly column: number;

  /** The first line of the matched code. */
  readonly code: string;

  /** What to do. */
  readonly message: string;
};
