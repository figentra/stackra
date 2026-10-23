/**
 * Stackra file contract:
 * Purpose: the props the web `Sheet` compound takes from the shared vocabulary: the accessible name of its dialog.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */

/** Props of `Sheet.Dialog` that the Stackra vocabulary names. */
export interface SheetDialogContractProps {
  /** The accessible name of the dialog; HeroUI Pro's `aria-label`. A `Sheet.Heading` inside names it too. */
  readonly label?: string | undefined;
}
