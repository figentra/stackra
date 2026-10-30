/**
 * Stackra file contract:
 * Purpose: `BoxPlotChartContractProps`, the props of every runtime's `BoxPlotChart`: the groups, the name, the number
 *          format, the palette and the height.
 * Boundary: types only. Each box is `boxStatsOf` its values: quartiles, Tukey whiskers and outliers.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { BoxPlotGroup } from "#contracts/types/box-plot-group.type";

/** Props shared by the web and native `BoxPlotChart`. */
export interface BoxPlotChartContractProps {
  /** The boxes, in reading order. */
  readonly groups: readonly BoxPlotGroup[];
  /** The chart's accessible name and the data table's caption, such as "Delivery time by city". */
  readonly label: string;
  /** How values are written, such as `{ style: "unit", unit: "minute" }`. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** `accent` steps (the default) or the `categorical` set. */
  readonly palette?: ChartPalette | undefined;
  /** The plot's height in pixels; 240 by default. */
  readonly height?: number | undefined;
  /** Draws the value axis; on by default, since a box is read against it. */
  readonly showValueAxis?: boolean | undefined;
  /** Shows the pointed or pressed box's summary; on by default. */
  readonly showTooltip?: boolean | undefined;
}
