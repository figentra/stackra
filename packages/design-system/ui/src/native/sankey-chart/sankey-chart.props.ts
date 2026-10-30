/**
 * Stackra file contract:
 * Purpose: `SankeyChartProps`, the props of the native `SankeyChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303; STA-1371.
 */
import type { SankeyChartContractProps } from "#contracts/types/sankey-chart-contract-props.type";

/** Props of the native SankeyChart. */
export type SankeyChartProps = SankeyChartContractProps & {
  readonly className?: string | undefined;
};
