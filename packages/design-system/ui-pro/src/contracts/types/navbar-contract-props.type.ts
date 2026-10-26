/**
 * Stackra file contract:
 * Purpose: the props the web `Navbar` compound takes from the shared vocabulary: the shared `size`, the accessible name of the navigation landmark and the name of its menu toggle.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { Size } from "@stackra/ui/contracts";

/** Props of the `Navbar` root that the Stackra vocabulary names. */
export interface NavbarContractProps {
  /** The accessible name of the navigation landmark; HeroUI Pro's `aria-label` on the `nav` element. */
  readonly label?: string | undefined;
  /** The size of the bar's items and toggle; HeroUI Pro's own default when left out. */
  readonly size?: Size | undefined;
}

/** Props of `Navbar.MenuToggle` that the Stackra vocabulary names. */
export interface NavbarMenuToggleContractProps {
  /** The accessible name of the toggle button; HeroUI Pro's `srLabel`; `ui_pro::navbar.open_menu` when left out. */
  readonly label?: string | undefined;
}
