/**
 * Stackra file contract:
 * Purpose: `KEYED_TYPES`, the commit types that must name an issue when `refs-issue-key` is on.
 * Boundary: a list of types; no repo-specific prefix lives here.
 * Runtime: node
 * Governing contract: ADR 0065 (Linear gate checked offline); ADR 0007 (documentation).
 */
/** Commit types that must name an issue. */
export const KEYED_TYPES = ["feat", "fix", "refactor", "perf"];
