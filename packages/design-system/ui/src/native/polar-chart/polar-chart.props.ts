/**
 * Stackra file contract:
 * Purpose: `PolarChartProps`, the props of the native `PolarChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371 (wave D, owner approval 2026-10-30).
 */
import type { PolarChartContractProps } from "#contracts/types/polar-chart-contract-props.type";

/** Props of the native PolarChart. */
export type PolarChartProps = PolarChartContractProps & { readonly className?: string | undefined };
