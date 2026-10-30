/**
 * Stackra file contract:
 * Purpose: `AreaChartContractProps`, the props of every runtime's `AreaChart`: the cartesian props and the curve.
 * Boundary: types only. Each area fades from its colour to clear, over the theme's surface.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0340 (decision 9: the chart set); STA-1371.
 */
import type { ChartCurve } from "#contracts/enums/chart-curve.enum";
import type { CartesianChartContractProps } from "#contracts/types/cartesian-chart-contract-props.type";

/** Props shared by the web and native `AreaChart`. */
export interface AreaChartContractProps extends CartesianChartContractProps {
  /** How the edge joins its points; `monotone` by default. */
  readonly curve?: ChartCurve | undefined;
}
