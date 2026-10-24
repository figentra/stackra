/**
 * Stackra file contract:
 * Purpose: the props the web `CheckboxButtonGroup` takes from the shared vocabulary: the accessible name of the group
 *          (`label`) and the disabled state (`isDisabled`, HeroUI Pro's own name). Every other prop, `layout` included,
 *          is HeroUI Pro's own and passes through unchanged.
 * Boundary: types only; web only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `CheckboxButtonGroup` that the Stackra vocabulary names. */
export interface CheckboxButtonGroupContractProps {
  /** The accessible name of the group, read by screen readers; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
  /** True to disable every checkbox button in the group. */
  readonly isDisabled?: boolean | undefined;
}
