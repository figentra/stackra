/**
 * Stackra file contract:
 * Purpose: `HeatmapGrid`, a heatmap's data laid out as rows of cells, with the value span its shades cover.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */

/** A heatmap's grid. */
export interface HeatmapGrid {
  /** The column categories, in first-seen order. */
  readonly columns: readonly string[];
  /** The row categories, in first-seen order. */
  readonly rows: readonly string[];
  /** One line per row, one value per column; null for a gap. */
  readonly cells: readonly (readonly (number | null)[])[];
  /** The smallest value in the grid, for the colour scale. */
  readonly min: number;
  /** The largest value in the grid, for the colour scale. */
  readonly max: number;
}
