/**
 * Stackra file contract:
 * Purpose: the props the web `DataGrid` takes from the shared vocabulary: the accessible name of the grid. Every
 *          other prop is HeroUI Pro's own and passes through unchanged.
 * Boundary: types only; web only (HeroUI Pro's DataGrid has no native counterpart).
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-003.
 */

/** Props of `DataGrid` that the Stackra vocabulary names. */
export interface DataGridContractProps {
  /** The accessible name of the grid, announced by assistive technology; HeroUI Pro's `aria-label`. */
  readonly label: string;
}
