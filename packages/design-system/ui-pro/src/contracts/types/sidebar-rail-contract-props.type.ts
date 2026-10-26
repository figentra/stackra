/**
 * Stackra file contract:
 * Purpose: `SidebarRailContractProps`, props of `Sidebar.Rail` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of `Sidebar.Rail` that the Stackra vocabulary names. */
export interface SidebarRailContractProps {
  /** The accessible name of the rail button; HeroUI Pro's `aria-label`; `ui_pro::sidebar.toggle` when left out. */
  readonly label?: string | undefined;
}
