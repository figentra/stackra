/**
 * Stackra file contract:
 * Purpose: `ConsumerGateDeps`, the two things a gate run takes from outside: a process runner and `git rev-parse
 *          HEAD`, so a test fakes both.
 * Boundary: type only; `createConsumerGateDeps` builds the real one.
 * Runtime: node
 * Governing contract: ADR 0500 (decision 3); STA-1813.
 */

/** The outside world of one gate run. */
export type ConsumerGateDeps = {
  /** Runs argv in `cwd` with its output in `logFile` (no shell); returns the exit code. */
  readonly exec: (argv: readonly string[], where: { cwd: string; logFile: string }) => number;

  /** The commit a directory is at, or `undefined` when it is not a repository. */
  readonly head: (dir: string) => string | undefined;
};
