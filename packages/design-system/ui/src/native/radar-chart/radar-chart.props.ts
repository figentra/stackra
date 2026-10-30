/**
 * Stackra file contract:
 * Purpose: `RadarChartProps`, the props of the native `RadarChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { RadarChartContractProps } from "#contracts/types/radar-chart-contract-props.type";

/** Props of the native RadarChart. */
export type RadarChartProps = RadarChartContractProps & { readonly className?: string | undefined };
