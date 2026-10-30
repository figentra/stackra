/**
 * Stackra file contract:
 * Purpose: `PageItem`, one slot of a Pagination: a page number, or `"ellipsis"` for a gap.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */

/** One slot of a pagination: a page number or a gap. */
export type PageItem = number | "ellipsis";
