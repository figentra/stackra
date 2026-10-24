/**
 * Stackra file contract:
 * Purpose: the props the web `ListView` takes from the shared vocabulary: its accessible name and the one boolean
 *          HeroUI Pro spells without `is`.
 * Boundary: types only; web only (HeroUI Pro's ListView has no native counterpart). Selection, `onAction` and every
 *          other prop are HeroUI Pro's own and pass through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */

/** Props of `ListView` that the Stackra vocabulary names. */
export interface ListViewContractProps {
  /** The accessible name of the list, announced by assistive technology; HeroUI Pro's `aria-label`. */
  readonly label: string;
  /** Whether rows are virtualised for a large data set; HeroUI Pro's `virtualized`. Off when left out. */
  readonly isVirtualized?: boolean | undefined;
}
