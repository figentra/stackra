/**
 * Stackra file contract:
 * Purpose: `DashboardGridProps`, the props of the web `DashboardGrid`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decisions 16 and 18); STA-1371.
 */
import type { DashboardGridContractProps } from "#contracts/types/dashboard-grid-contract-props.type";

/** Props of the web DashboardGrid. */
export type DashboardGridProps = DashboardGridContractProps & {
  /** Classes for the grid, such as a gap or margin. */
  readonly className?: string | undefined;
};
