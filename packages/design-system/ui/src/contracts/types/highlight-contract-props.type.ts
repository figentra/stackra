/**
 * Stackra file contract:
 * Purpose: `HighlightContractProps`, the props every runtime's `Highlight` takes: a text with the search terms in it
 *          marked, matching as people type (ignoring case, Arabic diacritics and letter variants).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave A, owner request 2026-10-29).
 */

/** Props shared by the web and native `Highlight`. */
export interface HighlightContractProps {
  /** The text. */
  readonly children: string;
  /** The search, or several terms; empty highlights nothing. */
  readonly query: string | readonly string[];
}
