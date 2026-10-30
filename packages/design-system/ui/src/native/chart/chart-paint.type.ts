/**
 * Stackra file contract:
 * Purpose: `ChartPaint`: the theme values `useChartPaint` returns for a chart's series and chrome.
 * Boundary: types only; not exported from the package.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); STA-1371.
 */

/** The paints of a chart. */
export interface ChartPaint {
  /** One value per requested series colour, in order. */
  readonly series: readonly string[];
  /** The muted colour for axes and labels. */
  readonly muted: string;
  /** The main text colour. */
  readonly foreground: string;
  /** The background colour behind the plot. */
  readonly surface: string;
  /** The grid and the radial track: the muted colour at 15%. */
  readonly grid: string;
  /** The block behind a pressed column: the foreground at 5%. */
  readonly cursorBlock: string;
}
