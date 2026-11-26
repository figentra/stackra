/**
 * Stackra file contract:
 * Purpose: `DocumentedCode`, one row of an error-code page as `documentedCodes` reads it: the code, its section, its
 *          cause and fix cells and its line.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); STA-2853.
 */

/** One documented code. */
export interface DocumentedCode {
  /** The code, as the first cell writes it between backticks. */
  readonly code: string;

  /** The `## ` heading the row sits under. */
  readonly section: string;

  /** The second cell: what causes it. */
  readonly cause: string;

  /** The third cell: how to fix it. */
  readonly fix: string;

  /** The 1-based line of the row. */
  readonly line: number;
}
