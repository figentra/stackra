/**
 * Stackra file contract:
 * Purpose: `ChartSeries`, one series of a chart (or one slice of a pie): the data key it reads, the label people see in
 *          the legend, tooltip and data table, and the theme colour it is drawn in.
 * Boundary: types only. A series with no colour takes the palette's colour by its position, wrapping after
 *           five.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One series of a chart. */
export interface ChartSeries {
  /** The key it reads in each row (cartesian charts), or the category it names (pie and radial charts). */
  readonly key: string;
  /** What people call it: the legend, the tooltip and the data table's header. */
  readonly label: string;
  /** Its theme colour; by default the chart palette's, in series order. */
  readonly color?: ChartColor | undefined;
  /**
   * The key of the previous period's value in each row. When the chart's `showComparison` is on, it is drawn as a
   * dashed twin of this series (line, area and bar charts) and gets its own column in the data table.
   */
  readonly compareKey?: string | undefined;
}
