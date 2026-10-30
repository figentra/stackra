/**
 * Stackra file contract:
 * Purpose: `BulletChartProps`, the props of the native `BulletChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { BulletChartContractProps } from "#contracts/types/bullet-chart-contract-props.type";

/** Props of the native BulletChart. */
export type BulletChartProps = BulletChartContractProps & {
  readonly className?: string | undefined;
};
