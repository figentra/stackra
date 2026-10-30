/**
 * Stackra file contract:
 * Purpose: `RadarChartContractProps`, the props of every runtime's `RadarChart`: one spoke per row, named by `xKey`,
 *          one filled shape per series.
 * Boundary: types only. Spokes run clockwise from the top in both directions.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartContractProps } from "#contracts/types/chart-contract-props.type";

/** Props shared by the web and native `RadarChart`. */
export interface RadarChartContractProps extends ChartContractProps {
  /** The key of each row's spoke name. */
  readonly xKey: string;
  /** Writes the spoke name as a date in the locale; names are shown as given without it. */
  readonly xFormat?: Intl.DateTimeFormatOptions | undefined;
}
