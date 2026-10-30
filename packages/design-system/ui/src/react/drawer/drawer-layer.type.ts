/**
 * Stackra file contract:
 * Purpose: `DrawerLayer`, what an open web drawer tells the parts inside it and the drawers opened from it: its depth
 *          in a stack of drawers, whether Escape closes it, and how a drawer opened over it marks it covered.
 * Boundary: types only; `Drawer` provides it through `DrawerLayerContext`.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12: one declaration per file); owner request 2026-10-29 (STA-1371, stacked
 *          drawers).
 */

/** One open drawer in a stack of them. */
export interface DrawerLayer {
  /** 1 for a drawer over the page, 2 for one opened from it, and so on. */
  readonly depth: number;
  /** True when Escape closes this drawer, so the header shows the Esc hint. */
  readonly isKeyboardDismissable: boolean;
  /** Called with +1 when a drawer opens over this one and -1 when it closes. */
  readonly cover: (delta: 1 | -1) => void;
  /** True when the header draws the expand button (a side drawer with `isExpandable`). */
  readonly isExpandable: boolean;
  /** True while the drawer is expanded to the full screen. */
  readonly isExpanded: boolean;
  /** Expands (true) or restores (false) the drawer. */
  readonly setExpanded: (isExpanded: boolean) => void;
}
