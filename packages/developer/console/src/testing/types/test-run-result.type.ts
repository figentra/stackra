/**
 * Stackra file contract:
 * Purpose: `TestRunResult`, what a test reads after `runCommandForTest`: the exit code, both streams, the `--json`
 *          document when there was one, and the questions asked.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-027.
 */

/** The result of one test run. */
export interface TestRunResult {
  /** The exit code. */
  readonly exitCode: number;

  /** Everything written to standard output. */
  readonly stdout: string;

  /** Everything written to standard error. */
  readonly stderr: string;

  /** Standard output parsed as JSON, when it is one document. */
  readonly json: unknown;

  /** The prompts the command asked, in order. */
  readonly asked: readonly string[];
}
