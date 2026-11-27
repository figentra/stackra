/**
 * Stackra file contract:
 * Purpose: `LIST_COMMAND`, the built-in command that prints the command list (`<bin> list`, the same list as the
 *          binary alone), and with `--all` (`LIST_ALL_FLAG`) every command, the hidden and this run's unlisted ones
 *          included. A registered command of the same name wins: the built-in answers only when no command claims
 *          `list`.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: STA-2872 spec FR-003; STA-1966 spec FR-013.
 */

/** The name of the built-in list command. */
export const LIST_COMMAND = "list";
