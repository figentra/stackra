/**
 * Stackra file contract:
 * Purpose: the prop the native `SplitView` compound takes from the shared vocabulary: the accessible name of its drag area.
 * Boundary: types only; native only. Every other prop is HeroUI Native Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-011.
 */

/** Props of `SplitView.DragArea` that the Stackra vocabulary names. */
export interface SplitViewDragAreaContractProps {
  /** The accessible name of the draggable divider; HeroUI Native Pro's `accessibilityLabel`. */
  readonly label?: string | undefined;
}
