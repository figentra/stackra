/**
 * Stackra file contract:
 * Purpose: `AppLayoutMenuToggleContractProps`, props of `AppLayout.MenuToggle` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */

/** Props of `AppLayout.MenuToggle` that the Stackra vocabulary names. */
export interface AppLayoutMenuToggleContractProps {
  /** The accessible name of the button; HeroUI Pro's `aria-label`, which defaults to "Open navigation". */
  readonly label?: string | undefined;
}
