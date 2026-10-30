/**
 * Stackra file contract:
 * Purpose: `HistogramChartContractProps`, the props of every runtime's `HistogramChart`: the raw values, how they are
 *          binned, the name, the number format and the look.
 * Boundary: types only. Bins come from `histogramBinsOf`, so web and native count the same.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** Props shared by the web and native `HistogramChart`. */
export interface HistogramChartContractProps {
  /** The raw values, such as each order's total; non-numbers are left out. */
  readonly values: readonly number[];
  /** The chart's accessible name and the data table's caption, such as "Order totals, October". */
  readonly label: string;
  /** How many bins; Sturges' rule (1 + log2 of the count) by default. */
  readonly binCount?: number | undefined;
  /** The width of each bin, in the values' unit; it wins over `binCount`. */
  readonly binWidth?: number | undefined;
  /** How the bin edges are written, such as `{ style: "currency", currency: "SAR" }`. */
  readonly valueFormat?: Intl.NumberFormatOptions | undefined;
  /** The bars' colour; the first step of the accent ramp by default. */
  readonly color?: ChartColor | undefined;
  /** The plot's height in pixels; 240 by default. */
  readonly height?: number | undefined;
  /** Draws the count axis; off by default, since the tooltip and the data table carry the counts. */
  readonly showValueAxis?: boolean | undefined;
  /** Shows the pointed or pressed bin's count; on by default. */
  readonly showTooltip?: boolean | undefined;
}
