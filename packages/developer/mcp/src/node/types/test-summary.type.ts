/**
 * Stackra file contract:
 * Purpose: `TestSummary`, what the `test` tool reads from a Vitest run: the file and test counts and each failure
 *          with its file, test path and first message line.
 * Boundary: type only; `parseTestOutput` builds it.
 * Runtime: node
 * Governing contract: ADR 0182 (test tiers); STA-2873.
 */

/** The counts and failures of one test run. */
export type TestSummary = {
  /** Test files by outcome. */
  readonly files: { readonly passed: number; readonly failed: number; readonly skipped: number };
  /** Tests by outcome. */
  readonly tests: {
    readonly passed: number;
    readonly failed: number;
    readonly skipped: number;
    readonly todo: number;
  };
  /** Each failed test, or a file that failed to load (no `test`). */
  readonly failures: readonly {
    /** The test file. */
    readonly file: string;
    /** The suite and test names joined by ` > `; absent when the file itself failed. */
    readonly test?: string;
    /** The first line of the error. */
    readonly message?: string;
  }[];
};
