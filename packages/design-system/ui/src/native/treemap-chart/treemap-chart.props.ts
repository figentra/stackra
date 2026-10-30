/**
 * Stackra file contract:
 * Purpose: `TreemapChartProps`, the props of the native `TreemapChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { TreemapChartContractProps } from "#contracts/types/treemap-chart-contract-props.type";

/** Props of the native TreemapChart. */
export type TreemapChartProps = TreemapChartContractProps & {
  readonly className?: string | undefined;
};
