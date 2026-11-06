/**
 * Stackra file contract:
 * Purpose: `CommandError`, a failure a command explains: what failed (the message), why, the exact command that
 *          fixes it, a docs link, and raw detail (a child process's output) that only `--verbose` shows. The run
 *          exits 1, and the error screen and the `--json` error carry each field.
 * Boundary: a plain `Error`; never put a prompt's answer or a secret in any field.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-011 and FR-019.
 */

/** What a `CommandError` explains beside its message. */
interface CommandErrorDetails {
  /** Why it failed. */
  readonly why?: string;
  /** The exact command that fixes it. */
  readonly fix?: string;
  /** A docs link. */
  readonly docs?: string;
  /** Raw output shown only under `--verbose`. */
  readonly detail?: string;
  /** The error behind it. */
  readonly cause?: unknown;
}

/**
 * A failure with its reason and fix.
 *
 * @example
 * throw new CommandError("Not a git repository", {
 *   why: `${cwd} has no .git`,
 *   fix: "git init",
 * });
 */
export class CommandError extends Error {
  /** Why it failed. */
  readonly why: string | undefined;

  /** The exact command that fixes it. */
  readonly fix: string | undefined;

  /** A docs link. */
  readonly docs: string | undefined;

  /** Raw output shown only under `--verbose`. */
  readonly detail: string | undefined;

  /**
   * @param message - what failed.
   * @param details - why, the fix, the docs link, raw detail and the cause.
   */
  constructor(message: string, details: CommandErrorDetails = {}) {
    super(message, details.cause === undefined ? undefined : { cause: details.cause });
    this.name = "CommandError";
    this.why = details.why;
    this.fix = details.fix;
    this.docs = details.docs;
    this.detail = details.detail;
  }
}
