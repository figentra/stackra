/**
 * Stackra file contract:
 * Purpose: `NavbarMenuToggleContractProps`, props of `Navbar.MenuToggle` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */

/** Props of `Navbar.MenuToggle` that the Stackra vocabulary names. */
export interface NavbarMenuToggleContractProps {
  /** The accessible name of the toggle button; HeroUI Pro's `srLabel`; `ui_pro::navbar.open_menu` when left out. */
  readonly label?: string | undefined;
}
