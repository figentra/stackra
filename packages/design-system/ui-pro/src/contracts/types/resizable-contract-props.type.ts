/**
 * Stackra file contract:
 * Purpose: the props the web `Resizable` compound takes from the shared vocabulary on its handle: the accessible name and the disabled state.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */

/** Props of `Resizable.Handle` that the Stackra vocabulary names. */
export interface ResizableHandleContractProps {
  /** The accessible name of the separator; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
  /** True to stop the handle from resizing; HeroUI Pro's `disabled`. */
  readonly isDisabled?: boolean | undefined;
}
