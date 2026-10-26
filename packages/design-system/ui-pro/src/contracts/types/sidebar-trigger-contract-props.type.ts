/**
 * Stackra file contract:
 * Purpose: `SidebarTriggerContractProps`, props of `Sidebar.Trigger` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of `Sidebar.Trigger` that the Stackra vocabulary names. */
export interface SidebarTriggerContractProps {
  /** The accessible name of the icon-only toggle button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
}
