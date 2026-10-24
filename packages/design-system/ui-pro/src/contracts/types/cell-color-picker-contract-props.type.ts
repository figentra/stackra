/**
 * Stackra file contract:
 * Purpose: the props the web `CellColorPicker.Trigger` takes from the shared vocabulary: the accessible name
 *          (`label`) and the disabled state (`isDisabled`, HeroUI Pro's own name). The root and every other prop are
 *          HeroUI Pro's own and pass through unchanged; the root has no accessible name of its own, because React Aria's
 *          colour picker draws no element.
 * Boundary: types only; web only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `CellColorPicker.Trigger` that the Stackra vocabulary names. */
export interface CellColorPickerTriggerContractProps {
  /** The accessible name of the trigger button, read by screen readers; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
  /** True to disable the trigger and refuse opening the popover. */
  readonly isDisabled?: boolean | undefined;
}
