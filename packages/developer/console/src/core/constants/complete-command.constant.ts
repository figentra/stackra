/**
 * Stackra file contract:
 * Purpose: `COMPLETE_COMMAND`, the hidden built-in a completion script calls with the words of the line
 *          (`<bin> complete -- mcp s`), answered with one candidate per line; no registered command may take its name.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-006 and FR-016.
 */

/** The name of the hidden command a completion script calls. */
export const COMPLETE_COMMAND = "complete";
