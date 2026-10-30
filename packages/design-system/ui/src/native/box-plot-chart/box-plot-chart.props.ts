/**
 * Stackra file contract:
 * Purpose: `BoxPlotChartProps`, the props of the native `BoxPlotChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { BoxPlotChartContractProps } from "#contracts/types/box-plot-chart-contract-props.type";

/** Props of the native BoxPlotChart. */
export type BoxPlotChartProps = BoxPlotChartContractProps & {
  readonly className?: string | undefined;
};
