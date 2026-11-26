/**
 * Stackra file contract:
 * Purpose: `LIST_ALL_FLAG`, the one option of the built-in `list` command: every command, the hidden ones and those
 *          the run leaves out of the list (`ConsoleConfig.unlisted`) included.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: STA-2872 spec FR-003.
 */

/** The flag of the built-in list command that shows every command. */
export const LIST_ALL_FLAG = "--all";
