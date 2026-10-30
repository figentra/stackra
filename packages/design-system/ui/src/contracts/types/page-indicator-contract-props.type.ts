/**
 * Stackra file contract:
 * Purpose: `PageIndicatorContractProps`, the props every runtime's `PageIndicator` takes: the dots under a carousel
 *          or onboarding pager, the current one drawn long.
 * Boundary: types only. With `onChange` each dot is a button to its page; without, the dots are one image named
 *           "Page 2 of 5". The dots follow the reading direction.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); WCAG 2.2 SC 2.5.8; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */

/** Props shared by the web and native `PageIndicator`. */
export interface PageIndicatorContractProps {
  /** How many pages there are. */
  readonly count: number;
  /** The current page, from 0. */
  readonly index: number;
  /** Called with a page's index when its dot is pressed; left out, the dots are display only. */
  readonly onChange?: ((index: number) => void) | undefined;
  /** The group's name. Defaults to the catalogue's "Pages". */
  readonly label?: string | undefined;
  /** Names a page's dot from its 1-based number and the count. Defaults to the catalogue's "Page 2 of 5". */
  readonly getPageLabel?: ((page: number, count: number) => string) | undefined;
}
