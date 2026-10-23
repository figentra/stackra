/**
 * Stackra file contract:
 * Purpose: the props the web `Sidebar` compound takes from the shared vocabulary: the accessible names of the
 *          sidebar landmark, its menus, its toggle button, its rail, its mobile sheet and its icon-only items.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of the `Sidebar` root that the Stackra vocabulary names. */
export interface SidebarContractProps {
  /** The accessible name of the sidebar landmark; HeroUI Pro's `aria-label` on the `aside` element. */
  readonly label?: string | undefined;
}

/** Props of `Sidebar.Menu` that the Stackra vocabulary names. */
export interface SidebarMenuContractProps {
  /** The accessible name of the menu, required by its tree role; HeroUI Pro's `aria-label`. */
  readonly label: string;
}

/** Props of `Sidebar.Trigger` that the Stackra vocabulary names. */
export interface SidebarTriggerContractProps {
  /** The accessible name of the icon-only toggle button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
}

/** Props of `Sidebar.Mobile` that the Stackra vocabulary names. */
export interface SidebarMobileContractProps {
  /** The accessible name of the navigation sheet, a dialog that HeroUI Pro leaves unnamed. */
  readonly label: string;
}

/** Props of `Sidebar.MenuIcon` that the Stackra vocabulary names. */
export interface SidebarMenuIconContractProps {
  /**
   * The name of the item while the sidebar is collapsed to icons, when HeroUI Pro hides its label and its tooltip
   * trigger would have no name; usually the item's own label. Ignored while the label is drawn.
   */
  readonly label?: string | undefined;
}

/** Props of `Sidebar.Rail` that the Stackra vocabulary names. */
export interface SidebarRailContractProps {
  /** The accessible name of the rail button; HeroUI Pro's `aria-label`, which defaults to "Toggle sidebar". */
  readonly label?: string | undefined;
}
