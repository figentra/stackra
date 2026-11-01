/**
 * Stackra file contract:
 * Purpose: `UsageError`, an invocation the kernel cannot run: an unknown command or option, a missing argument, a bad
 *          number, a value out of bounds or a surplus token. The run exits 2.
 * Boundary: a plain `Error` with an optional hint shown on the error screen.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-010 and FR-011.
 */

/** An invocation the Operator must change. */
export class UsageError extends Error {
  /** What to try instead, when there is something to suggest. */
  readonly hint: string | undefined;

  /**
   * @param message - what is wrong, naming the argument, option or command.
   * @param hint - what to try instead.
   */
  constructor(message: string, hint?: string) {
    super(message);
    this.name = "UsageError";
    this.hint = hint;
  }
}
