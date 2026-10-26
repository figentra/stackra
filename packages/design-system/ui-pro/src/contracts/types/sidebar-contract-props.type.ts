/**
 * Stackra file contract:
 * Purpose: the props the web `Sidebar` compound takes from the shared vocabulary: the accessible names of the
 *          sidebar landmark, its menus, its toggle button, its rail, its mobile sheet and its icon-only items.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of the `Sidebar` root that the Stackra vocabulary names. */
export interface SidebarContractProps {
  /** The accessible name of the sidebar landmark; HeroUI Pro's `aria-label` on the `aside` element. */
  readonly label?: string | undefined;
}
