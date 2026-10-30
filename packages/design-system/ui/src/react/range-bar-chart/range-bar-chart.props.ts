/**
 * Stackra file contract:
 * Purpose: `RangeBarChartProps`, the props of the web `RangeBarChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { RangeBarChartContractProps } from "#contracts/types/range-bar-chart-contract-props.type";

/** Props of the web RangeBarChart. */
export type RangeBarChartProps = RangeBarChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
