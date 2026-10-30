/**
 * Stackra file contract:
 * Purpose: `ComposedChartContractProps`, the props of every runtime's `ComposedChart`: the cartesian props and which
 *          series are drawn as lines over the others' bars (revenue as columns, margin as a line).
 * Boundary: types only. Series not named in `lineKeys` are bars, grouped or stacked like `BarChart`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";

/** Props shared by the web and native `ComposedChart`. */
export interface ComposedChartContractProps extends CartesianChartContractProps {
  /** The keys of the series drawn as lines; by default the last series is the line and the rest are bars. */
  readonly lineKeys?: readonly string[] | undefined;
}
