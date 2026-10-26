/**
 * Stackra file contract:
 * Purpose: the props the web `NativeSelect` parts take from the shared vocabulary: the root's full-width flag
 *          (`isFullWidth`, HeroUI Pro's `fullWidth`), and the trigger's accessible name (`label`) and disabled state
 *          (`isDisabled`, the native `disabled` attribute). Every other prop, `variant` included, is HeroUI Pro's own
 *          and passes through unchanged.
 * Boundary: types only; web only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of the `NativeSelect` root that the Stackra vocabulary names. */
export interface NativeSelectContractProps {
  /** True to make the select fill the width of its container; HeroUI Pro's `fullWidth`. */
  readonly isFullWidth?: boolean | undefined;
}
