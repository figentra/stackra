/**
 * Stackra file contract:
 * Purpose: `ChartContractProps`, the props every chart takes on web and native: the rows, the series config, the
 *          accessible name, the number format and the legend, tooltip and height switches.
 * Boundary: types only. The chart is one image with `label` as its name; its numbers are also given as a data table
 *          (web) or as spoken text (native), formatted in the provider's locale and the customer's digits
 *           (Latin by default, ADR 0192 as amended 2026-10-28).
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartPalette } from "#contracts/enums/chart-palette.enum";
import type { ChartDatum } from "#contracts/types/chart-datum.type";
import type { ChartSeries } from "#contracts/types/chart-series.type";

/** Props shared by every web and native chart. */
export interface ChartContractProps {
  /** The rows, in reading order. */
  readonly data: readonly ChartDatum[];
  /** The series drawn, in legend order. */
  readonly series: readonly ChartSeries[];
  /** The chart's accessible name and the data table's caption, such as "Visitors, last six months". */
  readonly label: string;
  /** The colours series take by position: `accent` steps (the default) or the `categorical` set. */
  readonly palette?: ChartPalette | undefined;
  /** How values are written: `{ style: "currency", currency: "USD" }`, `{ notation: "compact" }`. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The plot's height in pixels; 240 by default. */
  readonly height?: number | undefined;
  /** Shows the legend under the plot; on by default when there are two series or more. */
  readonly showLegend?: boolean | undefined;
  /** Shows the values of the pointed or pressed row; on by default. */
  readonly showTooltip?: boolean | undefined;
}
