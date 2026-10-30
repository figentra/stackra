/**
 * Stackra file contract:
 * Purpose: `BoxPlotGroup`, one box of a box plot: its name and its raw values.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-1371.
 */
import type { ChartColor } from "#contracts/enums/chart-color.enum";

/** One group of a box plot. */
export interface BoxPlotGroup {
  /** A stable id, unique within the chart. */
  readonly key: string;
  /** What people call it: the axis label, the tooltip and the data table. */
  readonly label: string;
  /** The raw values the box summarises; non-numbers are left out. */
  readonly values: readonly number[];
  /** Its theme colour; by default the palette's, by position. */
  readonly color?: ChartColor | undefined;
}
