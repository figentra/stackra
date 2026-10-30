/**
 * Stackra file contract:
 * Purpose: `GrowBarProps`: props of `GrowBar`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */

/** Props of {@link GrowBar}. */
export interface GrowBarProps {
  /** The bar's full height, a fraction of its row (0 to 1). */
  height: number;
  /** Its place in the row; each bar starts a beat after the one before. */
  index: number;
  /** Grows once on mount and on each change of this value, else breathes in a loop. */
  replay?: number | undefined;
  /** The bar's colour and corners, as classes. */
  className: string;
  /** True under Reduce Motion: drawn at full height, still. */
  isStill: boolean;
}
