/**
 * Stackra file contract:
 * Purpose: the props the web and native `RadioButtonGroup` take from the shared vocabulary: the accessible name of
 *          the group (`label`) and the disabled state (`isDisabled`, both HeroUI packages' own name). Every other prop,
 *          `value`, `onValueChange` or `onChange` and `variant` included, is HeroUI's own and passes through unchanged.
 * Boundary: types only; shared by both platforms.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003, FR-010.
 */

/** Props of `RadioButtonGroup` that the Stackra vocabulary names. */
export interface RadioButtonGroupContractProps {
  /** The accessible name of the group, read by screen readers; HeroUI's `aria-label` (web) or `accessibilityLabel` (native). */
  readonly label?: string | undefined;
  /** True to disable every radio button in the group. */
  readonly isDisabled?: boolean | undefined;
}
