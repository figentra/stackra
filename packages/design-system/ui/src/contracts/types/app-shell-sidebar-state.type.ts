/**
 * Stackra file contract:
 * Purpose: what AppShell tells the function form of its `sidebar` slot: where the sidebar is being drawn, so a sidebar
 *          that is collapsed to an icon rail in the page is drawn in full inside the drawer a narrow window opens.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0317 (decisions 1 and 4).
 */

/** The state AppShell hands a `sidebar` function. */
export interface AppShellSidebarState {
  /** True when the sidebar is drawn inside the off-canvas drawer (or sheet), false when it sits in the page. */
  readonly isInDrawer: boolean;
}
