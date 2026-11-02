/**
 * Stackra file contract:
 * Purpose: `COMPLETION_COMMAND`, the built-in command that prints the shell script wiring Tab to the CLI
 *          (`<bin> completion zsh`); no registered command may take its name.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-006 and FR-016.
 */

/** The name of the built-in completion command. */
export const COMPLETION_COMMAND = "completion";
