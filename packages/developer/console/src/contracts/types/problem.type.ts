/**
 * Stackra file contract:
 * Purpose: `Problem`, the one shape of every error screen: what failed, why, a hint, the exact fix command, a docs
 *          link, and what only `--verbose` shows (the error with its causes, and raw child output).
 * Boundary: a type only. Never carries a prompt's answer.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-011.
 */

/** A failure, as the operator reads it. */
export interface Problem {
  /** What failed. */
  readonly title: string;

  /** Why it failed. */
  readonly why?: string;

  /** A suggestion in words (`Did you mean status?`). */
  readonly hint?: string;

  /** The exact command that fixes it. */
  readonly fix?: string;

  /** A docs link. */
  readonly docs?: string;

  /** The error behind it; its stack and causes show under `--verbose`. */
  readonly error?: unknown;

  /** Raw output (a child process's), shown dimmed under `--verbose`. */
  readonly detail?: string;
}
