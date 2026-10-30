/**
 * Stackra file contract:
 * Purpose: `ActiveSectionInput`: what the scroll spy measured, for `activeSectionIndex`.
 * Boundary: a type only, in its own file.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (scroll-spied TOC and section tabs).
 */

/** What the scroll spy measured. */
export interface ActiveSectionInput {
  /** Each heading's top edge from the viewport's top, in page order; `undefined` for one not on the page. */
  readonly tops: readonly (number | undefined)[];
  /** The activation line, from the viewport's top. */
  readonly line: number;
  /** The page is scrolled to its very end. */
  readonly isAtBottom: boolean;
  /** The index chosen last time, for the hysteresis. */
  readonly previous?: number | undefined;
  /** The index of a section a click is scrolling to; it wins until the scroll ends. */
  readonly locked?: number | undefined;
  /** How far, in px, a heading must pass the line before the choice moves. */
  readonly hysteresis?: number | undefined;
}
