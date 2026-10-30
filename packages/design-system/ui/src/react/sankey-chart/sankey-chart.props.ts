/**
 * Stackra file contract:
 * Purpose: `SankeyChartProps`, the props of the web `SankeyChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { SankeyChartContractProps } from "#contracts/types/sankey-chart-contract-props.type";

/** Props of the web SankeyChart. */
export type SankeyChartProps = SankeyChartContractProps & {
  readonly className?: string | undefined;
};
