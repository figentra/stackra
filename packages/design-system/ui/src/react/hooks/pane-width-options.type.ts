/**
 * Stackra file contract:
 * Purpose: `PaneWidthOptions`, what `usePaneWidth` needs to own one resizable pane's width: the controlled width or
 *          the starting one, its bounds, the change callback and the storage key it is kept under.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12); STA-1371 (shared pane engine, owner approval 2026-10-29).
 */

/** The options of `usePaneWidth`. */
export interface PaneWidthOptions {
  /** The width in pixels, for a controlled pane; pair it with `onWidthChange`. */
  readonly width?: number | undefined;
  /** The starting width in pixels of an uncontrolled pane, when nothing is stored. */
  readonly defaultWidth: number;
  /** The narrowest width, in pixels. */
  readonly minWidth: number;
  /** The widest width, in pixels. */
  readonly maxWidth: number;
  /** Called with the new, clamped width after each resize. */
  readonly onWidthChange?: ((width: number) => void) | undefined;
  /** The local-storage key the width is kept under (`<storageKey>:width`), so it survives a reload. */
  readonly storageKey?: string | undefined;
}
