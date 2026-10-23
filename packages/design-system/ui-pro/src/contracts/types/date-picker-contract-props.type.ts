/**
 * Stackra file contract:
 * Purpose: the props the native `DatePicker` takes from the shared vocabulary: the accessible name (`label`) and the
 *          disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop is HeroUI Native Pro's own
 *          and passes through unchanged; its `value` is HeroUI's `DatePickerOption` (an ISO date string and a
 *          display label), not a date object.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-011.
 */

/** Props of the native `DatePicker` that the Stackra vocabulary names. */
export interface DatePickerContractProps {
  /** The accessible name of the field, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to disable the whole field, trigger included. */
  readonly isDisabled?: boolean | undefined;
}
