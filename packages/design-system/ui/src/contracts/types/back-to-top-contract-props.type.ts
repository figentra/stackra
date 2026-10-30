/**
 * Stackra file contract:
 * Purpose: `BackToTopContractProps`, the props every runtime's `BackToTop` takes: a floating button that appears once
 *          the page is scrolled past a threshold and takes people back to the top.
 * Boundary: types only; what is watched (the window, a container, a scroll view) is each runtime's own prop. The
 *           button sits at the inline end, so on the left in Arabic.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */

/** Props shared by the web and native `BackToTop`. */
export interface BackToTopContractProps {
  /** How far down, in pixels, before the button shows. Defaults to 400. */
  readonly threshold?: number | undefined;
  /** The button's accessible name. Defaults to the catalogue's "Back to top". */
  readonly label?: string | undefined;
}
