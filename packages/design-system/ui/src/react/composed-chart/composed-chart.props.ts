/**
 * Stackra file contract:
 * Purpose: `ComposedChartProps`, the props of the web `ComposedChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { ComposedChartContractProps } from "#contracts/types/composed-chart-contract-props.type";

/** Props of the web ComposedChart. */
export type ComposedChartProps = ComposedChartContractProps & {
  readonly className?: string | undefined;
};
