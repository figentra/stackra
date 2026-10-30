/**
 * Stackra file contract:
 * Purpose: `SunburstChartProps`, the props of the native `SunburstChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303; STA-1371.
 */
import type { SunburstChartContractProps } from "#contracts/types/sunburst-chart-contract-props.type";

/** Props of the native SunburstChart. */
export type SunburstChartProps = SunburstChartContractProps & {
  readonly className?: string | undefined;
};
