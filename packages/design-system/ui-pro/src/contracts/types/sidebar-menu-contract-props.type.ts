/**
 * Stackra file contract:
 * Purpose: `SidebarMenuContractProps`, props of `Sidebar.Menu` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of `Sidebar.Menu` that the Stackra vocabulary names. */
export interface SidebarMenuContractProps {
  /** The accessible name of the menu, required by its tree role; HeroUI Pro's `aria-label`. */
  readonly label: string;
}
