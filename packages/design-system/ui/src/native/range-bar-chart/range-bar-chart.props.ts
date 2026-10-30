/**
 * Stackra file contract:
 * Purpose: `RangeBarChartProps`, the props of the native `RangeBarChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { RangeBarChartContractProps } from "#contracts/types/range-bar-chart-contract-props.type";

/** Props of the native RangeBarChart. */
export type RangeBarChartProps = RangeBarChartContractProps & {
  readonly className?: string | undefined;
};
