/**
 * Stackra file contract:
 * Purpose: `ROW_PATH`, the pattern of a dotted row path (`totals.totalMinor`) a saved view's keys and an export's
 *          columns are written as.
 * Boundary: the one copy of the pattern: the shape classes' `@Str({ pattern })` rules and the shipped zod schemas both
 *           read it, so they cannot drift; internal, not exported from the package.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rules 6 and 9: views store declared keys only).
 */

/** The pattern a dotted row path matches. */
export const ROW_PATH = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/;
