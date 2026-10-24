/**
 * Stackra file contract:
 * Purpose: the prop the tab row of the native `MorphTabs` compound takes from the shared vocabulary: its accessible name.
 * Boundary: types only; native only. Every other prop is HeroUI Native Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */

/** Props of `MorphTabs.List` that the Stackra vocabulary names. */
export interface MorphTabsListContractProps {
  /** The accessible name of the tab list; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
}
