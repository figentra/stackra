/**
 * Stackra file contract:
 * Purpose: `ConsoleDeclarationError`, a command declared wrongly: a bad name, a required argument after an optional
 *          one, a list argument that is not last, a duplicate flag or an option that takes a global option's name.
 * Boundary: a plain `Error`: a declaration mistake is a bug in the CLI, never an answer to the Operator.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-005.
 */

/** A command whose declaration the console refuses. */
export class ConsoleDeclarationError extends Error {
  /** The command's class name. */
  readonly command: string;

  /**
   * @param command - the command's class name.
   * @param reason - what is wrong, naming the field.
   */
  constructor(command: string, reason: string) {
    super(`${command}: ${reason}`);
    this.name = "ConsoleDeclarationError";
    this.command = command;
  }
}
