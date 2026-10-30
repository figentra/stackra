/**
 * Stackra file contract:
 * Purpose: `DrawerLayer`, what an open native drawer tells the parts inside it and the drawers opened from it: its
 *          depth in a stack of drawers, whether it is drawn as a side panel (a tablet) or a sheet, and how to close it.
 * Boundary: types only; `Drawer` provides it through `DrawerLayerContext`.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12: one declaration per file); owner request 2026-10-29 (STA-1371).
 */

/** One open native drawer. */
export interface DrawerLayer {
  /** 1 for a drawer over the screen, 2 for one opened from it, and so on. */
  readonly depth: number;
  /** True when the drawer is a floating side panel (HeroUI Native's Dialog), false for a bottom sheet. */
  readonly isPanel: boolean;
}
