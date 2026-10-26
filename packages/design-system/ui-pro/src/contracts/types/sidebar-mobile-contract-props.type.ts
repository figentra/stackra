/**
 * Stackra file contract:
 * Purpose: `SidebarMobileContractProps`, props of `Sidebar.Mobile` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of `Sidebar.Mobile` that the Stackra vocabulary names. */
export interface SidebarMobileContractProps {
  /** The accessible name of the navigation sheet, a dialog that HeroUI Pro leaves unnamed. */
  readonly label: string;
}
