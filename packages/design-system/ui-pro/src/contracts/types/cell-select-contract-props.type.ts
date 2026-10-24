/**
 * Stackra file contract:
 * Purpose: the props the web `CellSelect` takes from the shared vocabulary: the accessible name (`label`) and the
 *          disabled state (`isDisabled`, HeroUI Pro's own name). Every other prop is HeroUI Pro's own and passes
 *          through unchanged.
 * Boundary: types only; web only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `CellSelect` that the Stackra vocabulary names. */
export interface CellSelectContractProps {
  /** The accessible name of the select, read by screen readers; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
  /** True to disable the select and refuse opening its popover. */
  readonly isDisabled?: boolean | undefined;
}
