/**
 * Stackra file contract:
 * Purpose: `OUTPUT_LIMIT`, the most plain-text output one tool result carries; the tail is kept, where failures are.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0282 (decision 5).
 */

/** Characters of command output a tool result keeps. */
export const OUTPUT_LIMIT = 20_000;
