/**
 * Stackra file contract:
 * Purpose: `CartesianChartContractProps`, the props the area, bar and line charts share on top of
 *          `ChartContractProps`: the category key, how a category is written, and the grid and axis switches.
 * Boundary: types only. The category axis runs in the reading direction: right to left in Arabic, the value axis on
 *          the reading start.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartContractProps } from "#contracts/types/chart-contract-props.type";
import type { ChartReference } from "#contracts/types/chart-reference.type";

/** Props shared by the area, bar and line charts. */
export interface CartesianChartContractProps extends ChartContractProps {
  /** The key of each row's category: a month name, an ISO date. */
  readonly xKey: string;
  /** Writes the category as a date in the locale (`{ month: "short" }`); categories are shown as given without it. */
  readonly xFormat?: Intl.DateTimeFormatOptions | undefined;
  /** Stacks the series on one another; side by side (bars) or overlapping (areas, lines) by default. */
  readonly stacked?: boolean | undefined;
  /**
   * With `stacked`, stacks each category to 100%: every series is drawn as its share of the category's total and the
   * value axis reads in percent (area and bar charts). The tooltip and data table keep the real values.
   */
  readonly isNormalized?: boolean | undefined;
  /** Draws the horizontal grid lines; on by default. */
  readonly showGrid?: boolean | undefined;
  /** Draws the value axis; off by default, since the tooltip and the data table carry the values. */
  readonly showValueAxis?: boolean | undefined;
  /** Target lines and threshold bands on the value axis, drawn behind the series. */
  readonly references?: readonly ChartReference[] | undefined;
  /** Draws each series' `compareKey` values as a dashed twin: the previous period beside this one. Off by default. */
  readonly showComparison?: boolean | undefined;
  /**
   * Adds a brush under the plot to zoom into a span of the categories (web line, area and composed charts; native
   * reads every row and ignores it). Off by default.
   */
  readonly showBrush?: boolean | undefined;
}
