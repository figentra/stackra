/**
 * Stackra file contract:
 * Purpose: `HELP_COMMAND`, the built-in command that prints the command list (`help`) or a command's help
 *          (`help <cmd>`); no registered command may take its name.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-013 and FR-016.
 */

/** The name of the built-in help command. */
export const HELP_COMMAND = "help";
