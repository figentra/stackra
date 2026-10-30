/**
 * Stackra file contract:
 * Purpose: `DashboardGridProps`, the props of the native `DashboardGrid`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 16 and 18); STA-1371.
 */
import type { DashboardGridContractProps } from "#contracts/types/dashboard-grid-contract-props.type";

/** Props of the native DashboardGrid. */
export type DashboardGridProps = DashboardGridContractProps & {
  /** Classes for the column, such as a gap or padding. */
  readonly className?: string | undefined;
};
