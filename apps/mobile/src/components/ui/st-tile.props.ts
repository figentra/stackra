/**
 * Stackra file contract:
 * Purpose: `StTileProps`: props of `StTile`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link StTile}. */
export interface StTileProps {
  /** The tile's side, in points. */
  size: number;
}
