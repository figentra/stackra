/**
 * Stackra file contract:
 * Purpose: `ComposedChartProps`, the props of the native `ComposedChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { ComposedChartContractProps } from "#contracts/types/composed-chart-contract-props.type";

/** Props of the native ComposedChart. */
export type ComposedChartProps = ComposedChartContractProps & {
  readonly className?: string | undefined;
};
