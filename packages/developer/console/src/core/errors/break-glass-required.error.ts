/**
 * Stackra file contract:
 * Purpose: `BreakGlassRequiredError`, an audited command run in production by an operator with no open break-glass
 *          session (none bound, none open, or one that has ended): the run is refused before its handler, exit 1.
 * Boundary: a plain `Error` with a hint shown on the error screen.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-018; ADR 0188 (SC12).
 */

/** A production run with no open break-glass session. */
export class BreakGlassRequiredError extends Error {
  /** What to do about it. */
  readonly hint: string;

  /**
   * @param command - the command's name.
   * @param operator - who ran it.
   * @param why - what was missing.
   */
  constructor(command: string, operator: string, why: string) {
    super(
      `${command} needs an open break-glass session in production, and ${operator} has none: ${why}`,
    );
    this.name = "BreakGlassRequiredError";
    this.hint = "Open a break-glass session through the IAM service, then run the command again";
  }
}
