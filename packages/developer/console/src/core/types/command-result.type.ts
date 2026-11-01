/**
 * Stackra file contract:
 * Purpose: `CommandResult`, what `handle` returns: an exit code from 0 to 255, nothing (exit 0), or an object that is
 *          the `--json` document's `data`.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: STA-1730 spec FR-012 and FR-022.
 */

/** The return value of a command's `handle`. */
export type CommandResult =
  | number
  | undefined
  | Readonly<Record<string, unknown>>
  | readonly unknown[];
