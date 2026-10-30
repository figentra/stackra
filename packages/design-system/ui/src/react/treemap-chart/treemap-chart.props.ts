/**
 * Stackra file contract:
 * Purpose: `TreemapChartProps`, the props of the web `TreemapChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { TreemapChartContractProps } from "#contracts/types/treemap-chart-contract-props.type";

/** Props of the web TreemapChart. */
export type TreemapChartProps = TreemapChartContractProps & {
  readonly className?: string | undefined;
};
