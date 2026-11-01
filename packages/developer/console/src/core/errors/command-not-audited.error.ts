/**
 * Stackra file contract:
 * Purpose: `CommandNotAuditedError`, an audited command whose entry could not be written after it ran: the run exits
 *          1 (or keeps its failure code), and the screen says plainly that the run was not audited.
 * Boundary: a plain `Error`; `cause` is the sink's error, and `runError` the run's own failure when it had one.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-015.
 */

/** An audited run that left no audit entry. */
export class CommandNotAuditedError extends Error {
  /** What to do about it. */
  readonly hint: string;

  /** The run's own error, when the run failed as well. */
  readonly runError: unknown;

  /**
   * @param command - the command's name.
   * @param cause - why the entry could not be written.
   * @param runError - the run's own error, when it failed.
   */
  constructor(command: string, cause: unknown, runError?: unknown) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    const failed = runError instanceof Error ? `; the run itself failed: ${runError.message}` : "";
    super(`${command} ran, and this run was NOT audited: ${reason}${failed}`, { cause });
    this.name = "CommandNotAuditedError";
    this.hint =
      "Record what this run changed by hand, and fix the CommandAudit sink before the next run";
    this.runError = runError;
  }
}
