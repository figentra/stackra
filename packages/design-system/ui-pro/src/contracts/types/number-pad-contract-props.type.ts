/**
 * Stackra file contract:
 * Purpose: the props the native `NumberPad` takes from the shared vocabulary: the accessible name (`label`) and the
 *          disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop, `value`, `onValueChange`,
 *          `maxLength` and `onComplete` included, is HeroUI Native Pro's own and passes through unchanged.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */

/** Props of the native `NumberPad` that the Stackra vocabulary names. */
export interface NumberPadContractProps {
  /** The accessible name of the pad, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to disable every key of the pad. */
  readonly isDisabled?: boolean | undefined;
}
