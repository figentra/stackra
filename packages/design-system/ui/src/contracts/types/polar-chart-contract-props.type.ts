/**
 * Stackra file contract:
 * Purpose: `PolarChartContractProps`, the props of every runtime's `PolarChart` (a polar area or Nightingale rose
 *          chart): one equal-angle sector per row, named by `xKey`, whose radius is its value; with more than one
 *          series each row's sector is split into one slice per series.
 * Boundary: types only. Sectors run clockwise from the top in both directions; the chart is never mirrored.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { ChartContractProps } from "#contracts/types/chart-contract-props.type";

/** Props shared by the web and native `PolarChart`. */
export interface PolarChartContractProps extends ChartContractProps {
  /** The key of each row's sector name, such as a month or a weekday. */
  readonly xKey: string;
  /** Writes the sector name as a date in the locale; names are shown as given without it. */
  readonly xFormat?: Intl.DateTimeFormatOptions | undefined;
}
