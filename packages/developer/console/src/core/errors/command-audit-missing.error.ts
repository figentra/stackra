/**
 * Stackra file contract:
 * Purpose: `CommandAuditMissingError`, an audited command run with no `CommandAudit` bound: the run is refused before
 *          its handler starts, and exits 1.
 * Boundary: a plain `Error` with a hint shown on the error screen.
 * Runtime: isomorphic
 * Governing contract: STA-1731 spec FR-015.
 */

/** An audited command has nowhere to write its audit entry. */
export class CommandAuditMissingError extends Error {
  /** What to do about it. */
  readonly hint: string;

  /**
   * @param command - the command's name.
   */
  constructor(command: string) {
    super(`${command} is audited, and no CommandAudit is bound`);
    this.name = "CommandAuditMissingError";
    this.hint =
      "Bind a CommandAudit driver (the one in @stackra/access-log) in the member's container";
  }
}
