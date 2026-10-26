/**
 * Stackra file contract:
 * Purpose: `SidebarMenuIconContractProps`, props of `Sidebar.MenuIcon` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of `Sidebar.MenuIcon` that the Stackra vocabulary names. */
export interface SidebarMenuIconContractProps {
  /**
   * The name of the item while the sidebar is collapsed to icons, when HeroUI Pro hides its label and its tooltip
   * trigger would have no name; usually the item's own label. Ignored while the label is drawn.
   */
  readonly label?: string | undefined;
}
