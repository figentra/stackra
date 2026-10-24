/**
 * Stackra file contract:
 * Purpose: what the playground shell hands the page it renders, through the outlet context: the way to open the
 *          command palette, so a page (the index) can offer search without a second palette.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14).
 */

/** The playground shell's outlet context. */
export interface ShellContext {
  /** Opens the command palette. */
  readonly openPalette: () => void;
}
