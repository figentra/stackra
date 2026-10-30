/**
 * Stackra file contract:
 * Purpose: `LineChartContractProps`, the props of every runtime's `LineChart`: the cartesian props, the curve and dots.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartCurve } from "#contracts/enums/chart-curve.enum";
import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";

/** Props shared by the web and native `LineChart`. */
export interface LineChartContractProps extends CartesianChartContractProps {
  /** How the line joins its points; `monotone` by default. */
  readonly curve?: ChartCurve | undefined;
  /** Marks each point with a dot; off by default. */
  readonly showDots?: boolean | undefined;
}
