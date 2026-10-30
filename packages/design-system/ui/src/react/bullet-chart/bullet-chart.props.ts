/**
 * Stackra file contract:
 * Purpose: `BulletChartProps`, the props of the web `BulletChart`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { BulletChartContractProps } from "#contracts/types/bullet-chart-contract-props.type";

/** Props of the web BulletChart. */
export type BulletChartProps = BulletChartContractProps & {
  /** Classes for the figure, such as a width or margin. */
  readonly className?: string | undefined;
};
