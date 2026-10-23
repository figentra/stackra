/**
 * Stackra file contract:
 * Purpose: the props the native `Calendar` takes from the shared vocabulary: the accessible name (`label`) and the
 *          disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop is HeroUI Native Pro's own
 *          and passes through unchanged; the `value`, `minValue` and `maxValue` stay `@internationalized/date` types.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-403 FR-011.
 */

/** Props of the native `Calendar` that the Stackra vocabulary names. */
export interface CalendarContractProps {
  /** The accessible name of the calendar, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to disable every date and the month navigation. */
  readonly isDisabled?: boolean | undefined;
}
