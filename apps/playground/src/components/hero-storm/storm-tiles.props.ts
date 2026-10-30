/**
 * Stackra file contract:
 * Purpose: `StormTilesProps`: props of `StormTiles`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); ADR 0303 (props vocabulary).
 */

/** Props of {@link StormTiles}. */
export interface StormTilesProps {
  /** Reduced motion: the tiles and bars are drawn in place and the ring stands still. */
  readonly isStill: boolean;
}
