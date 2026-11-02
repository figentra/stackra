/**
 * Stackra file contract:
 * Purpose: `CheckStatus`, the status of a checklist row or a status cell: ok, warn, fail, skip or info.
 * Boundary: a type only. A status is always written with a symbol and a word, never by colour alone.
 * Runtime: isomorphic
 * Governing contract: STA-1966 spec FR-008 and FR-009.
 */

/** The status of a row. */
export type CheckStatus = "ok" | "warn" | "fail" | "skip" | "info";
