/**
 * Stackra file contract:
 * Purpose: `SHELLS`, the shells `<bin> completion <shell>` writes a script for.
 * Boundary: a constant only.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-006.
 */

/** The shells with a completion script. */
export const SHELLS = ["bash", "zsh", "fish"] as const;
