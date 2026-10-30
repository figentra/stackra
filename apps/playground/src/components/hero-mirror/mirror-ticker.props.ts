/**
 * Stackra file contract:
 * Purpose: `MirrorTickerProps`: props of `MirrorTicker`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0303 (props vocabulary).
 */

/** Props of {@link MirrorTicker}. */
export interface MirrorTickerProps {
  /** Reduced motion: the names stand still. */
  readonly isStill: boolean;
}
