/**
 * Stackra file contract:
 * Purpose: `BoxPlotChartProps`, the props of the web `BoxPlotChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { BoxPlotChartContractProps } from "#contracts/types/box-plot-chart-contract-props.type";

/** Props of the web BoxPlotChart. */
export type BoxPlotChartProps = BoxPlotChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
