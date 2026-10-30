/**
 * Stackra file contract:
 * Purpose: `TocItem`, one entry of a table of contents: the id of the heading it points at, its text and its level.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */

/** One entry of a table of contents. */
export interface TocItem {
  /** The id of the heading (web) or the key the app scrolls to (native). */
  readonly id: string;
  readonly label: string;
  /** 2 for a section, 3 for a subsection; 2 by default. */
  readonly level?: 2 | 3 | undefined;
}
