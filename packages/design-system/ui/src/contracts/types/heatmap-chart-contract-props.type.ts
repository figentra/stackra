/**
 * Stackra file contract:
 * Purpose: `HeatmapChartContractProps`, the props the web and native `HeatmapChart` share: a grid of cells, one per
 *          column and row category, shaded by value in five steps of one colour.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";
import type { ChartDatum } from "#contracts/types/chart-datum.type";

/** Props shared by the web and native `HeatmapChart`. */
export interface HeatmapChartContractProps {
  /** One row per cell. */
  readonly data: readonly ChartDatum[];
  /** The key of each cell's column category, such as the hour. */
  readonly xKey: string;
  /** The key of each cell's row category, such as the weekday. */
  readonly yKey: string;
  /** The key of each cell's number. */
  readonly valueKey: string;
  /** The chart's accessible name and the data table's caption, such as "Orders by hour and weekday". */
  readonly label: string;
  /** How values are written; plain numbers in the locale by default. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The colour the shades are mixed from; the first step of the accent ramp by default. */
  readonly color?: ChartColor | undefined;
  /** Shows the "Less … More" scale under the grid; on by default. */
  readonly showLegend?: boolean | undefined;
}
