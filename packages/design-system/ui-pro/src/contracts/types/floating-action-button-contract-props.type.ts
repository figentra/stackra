/**
 * Stackra file contract:
 * Purpose: the props the native `FloatingActionButton` takes from the shared vocabulary: the accessible name
 *          (`label`) and the disabled state (`isDisabled`, HeroUI Native Pro's own name). Every other prop,
 *          `placement`, `align`, `isOpen` and `onOpenChange` included, is HeroUI Native Pro's own and passes through.
 * Boundary: types only; native only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-007.
 */

/** Props of the native `FloatingActionButton` that the Stackra vocabulary names. */
export interface FloatingActionButtonContractProps {
  /** The accessible name of the button, read by screen readers; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
  /** True to refuse the press that opens the menu and show the disabled style. */
  readonly isDisabled?: boolean | undefined;
}
