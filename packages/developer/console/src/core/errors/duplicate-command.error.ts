/**
 * Stackra file contract:
 * Purpose: `DuplicateCommandError`, two commands of one registry that answer to the same name or alias.
 * Boundary: a plain `Error`, thrown by `createConsole` before any run.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-007.
 */

/** Two commands claim one name. */
export class DuplicateCommandError extends Error {
  /** The name both claim. */
  readonly commandName: string;

  /**
   * @param commandName - the name or alias both claim.
   * @param first - the class registered first.
   * @param second - the class that claims it again.
   */
  constructor(commandName: string, first: string, second: string) {
    super(`The command name "${commandName}" is claimed by both ${first} and ${second}`);
    this.name = "DuplicateCommandError";
    this.commandName = commandName;
  }
}
