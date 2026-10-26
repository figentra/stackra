/**
 * Stackra file contract:
 * Purpose: `ToolOutput`, what a tool run by a check phase left behind: its exit code and its standard output and error,
 *          kept apart so a JSON report on stdout parses.
 * Boundary: type only; `runCaptured` builds it, or returns `undefined` when the tool is not installed.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 3).
 */

/** The captured result of one tool process. */
export type ToolOutput = {
  /** The exit code. */
  readonly code: number;

  /** Everything the tool wrote to standard output. */
  readonly stdout: string;

  /** Everything the tool wrote to standard error. */
  readonly stderr: string;
};
