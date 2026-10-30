/**
 * Stackra file contract:
 * Purpose: `HistogramChartProps`, the props of the native `HistogramChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { HistogramChartContractProps } from "#contracts/types/histogram-chart-contract-props.type";

/** Props of the native HistogramChart. */
export type HistogramChartProps = HistogramChartContractProps & {
  readonly className?: string | undefined;
};
