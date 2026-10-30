/**
 * Stackra file contract:
 * Purpose: `HistogramChartProps`, the props of the web `HistogramChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { HistogramChartContractProps } from "#contracts/types/histogram-chart-contract-props.type";

/** Props of the web HistogramChart. */
export type HistogramChartProps = HistogramChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
