/**
 * Stackra file contract:
 * Purpose: the props the web `CellSwitch` takes from the shared vocabulary: the accessible name (`label`) and the
 *          disabled state (`isDisabled`, HeroUI Pro's own name). Every other prop is HeroUI Pro's own and passes
 *          through unchanged.
 * Boundary: types only; web only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `CellSwitch` that the Stackra vocabulary names. */
export interface CellSwitchContractProps {
  /** The accessible name of the switch, read by screen readers; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
  /** True to disable the switch and refuse toggling. */
  readonly isDisabled?: boolean | undefined;
}
