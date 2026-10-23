/**
 * Stackra file contract:
 * Purpose: the props the native `NumberField` takes from the shared vocabulary: the accessible name (`label`) and
 *          the disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop is HeroUI Native Pro's
 *          own and passes through unchanged; its `value` is a plain `number`.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-012.
 */

/** Props of the native `NumberField` that the Stackra vocabulary names. */
export interface NumberFieldContractProps {
  /** The accessible name of the field, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to disable the input and both stepper buttons. */
  readonly isDisabled?: boolean | undefined;
}
