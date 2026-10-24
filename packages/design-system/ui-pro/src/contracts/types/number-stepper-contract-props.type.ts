/**
 * Stackra file contract:
 * Purpose: the props the web and native `NumberStepper` take from the shared vocabulary: the accessible name
 *          (`label`) and the disabled state (`isDisabled`, both HeroUI packages' own name). Every other prop, `value`,
 *          `minValue`, `maxValue`, `step` and the web `size`, is HeroUI's own and passes through unchanged.
 * Boundary: types only; shared by both platforms.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003, FR-010.
 */

/** Props of `NumberStepper` that the Stackra vocabulary names. */
export interface NumberStepperContractProps {
  /** The accessible name of the stepper, read by screen readers; HeroUI's `aria-label` (web) or `accessibilityLabel` (native). */
  readonly label?: string | undefined;
  /** True to disable the stepper and both its buttons. */
  readonly isDisabled?: boolean | undefined;
}
