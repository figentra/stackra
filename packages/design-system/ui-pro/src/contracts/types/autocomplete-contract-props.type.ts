/**
 * Stackra file contract:
 * Purpose: the props the native `Autocomplete` takes from the shared vocabulary: the accessible name (`label`) and
 *          the disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop, `value`,
 *          `onValueChange`, `filter` and `selectionMode` included, is HeroUI Native Pro's own and passes through
 *          unchanged.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-010.
 */

/** Props of the native `Autocomplete` that the Stackra vocabulary names. */
export interface AutocompleteContractProps {
  /** The accessible name of the field, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to disable the trigger and refuse opening the overlay. */
  readonly isDisabled?: boolean | undefined;
}
