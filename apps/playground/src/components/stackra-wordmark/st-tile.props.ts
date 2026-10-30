/**
 * Stackra file contract:
 * Purpose: `StTileProps`: props of `StTile`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link StTile}. */
export interface StTileProps {
  /** Sizing classes. */
  className?: string;
}
