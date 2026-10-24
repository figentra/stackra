/**
 * Stackra file contract:
 * Purpose: the props the native `WheelPicker` takes from the shared vocabulary: the accessible name (`label`) and
 *          the disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop, `items`, `value`,
 *          `onValueChange` and `visibleCount` included, is HeroUI Native Pro's own and passes through unchanged.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */

/** Props of the native `WheelPicker` that the Stackra vocabulary names. */
export interface WheelPickerContractProps {
  /** The accessible name of the wheel, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to refuse scrolling and selecting on the wheel. */
  readonly isDisabled?: boolean | undefined;
}
