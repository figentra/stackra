/**
 * Stackra file contract:
 * Purpose: `AreaChartProps`, the props of the native `AreaChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { AreaChartContractProps } from "#contracts/types/area-chart-contract-props.type";

/** Props of the native AreaChart. */
export type AreaChartProps = AreaChartContractProps & { readonly className?: string | undefined };
