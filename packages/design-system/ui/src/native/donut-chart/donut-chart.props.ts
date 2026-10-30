/**
 * Stackra file contract:
 * Purpose: `DonutChartProps`, the props of the native `DonutChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; ADR 0060 (right-to-left); WCAG 2.2 SC 1.1.1, 1.4.11 and 2.3.3; STA-1371.
 */
import type { DonutChartContractProps } from "#contracts/types/donut-chart-contract-props.type";

/** Props of the native DonutChart. */
export type DonutChartProps = DonutChartContractProps & { readonly className?: string | undefined };
