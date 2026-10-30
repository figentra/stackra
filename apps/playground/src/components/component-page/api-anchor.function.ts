/**
 * Stackra file contract:
 * Purpose: `apiAnchor`, the anchor id of a part's API table: `api-Tabs.List` for `Tabs.List`, the id the shell's
 *          `toc-rail` (`tocItems`) links to.
 * Boundary: a pure function; the TOC rail and the search index link to it.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.2 and 4 (row 9).
 */

/** The anchor id of `part`. */
export function apiAnchor(part: string): string {
  return `api-${part}`;
}
