/**
 * Stackra file contract:
 * Purpose: the props the web `ActionBar` takes from the shared vocabulary: the accessible name of its toolbar.
 * Boundary: types only; web only (HeroUI Pro's ActionBar has no native counterpart). `isOpen` and every other prop
 *          are HeroUI Pro's own and pass through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */

/** Props of `ActionBar` that the Stackra vocabulary names. */
export interface ActionBarContractProps {
  /** The accessible name of the toolbar; HeroUI Pro's `aria-label`, which defaults to "Actions" when left out. */
  readonly label?: string | undefined;
}
