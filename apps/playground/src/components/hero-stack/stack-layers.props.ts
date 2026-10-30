/**
 * Stackra file contract:
 * Purpose: `StackLayersProps`: props of `StackLayers`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0303 (props vocabulary).
 */

/** Props of {@link StackLayers}. */
export interface StackLayersProps {
  /** The layers pressed into one (the product alone), instead of floating apart. */
  readonly isAssembled: boolean;
  /** Reduced motion: no float, no scan, no growing bars; changes land at once. */
  readonly isStill: boolean;
}
