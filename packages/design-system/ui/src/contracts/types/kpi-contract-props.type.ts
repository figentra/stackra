/**
 * Stackra file contract:
 * Purpose: `KpiContractProps`, the props of every runtime's `Kpi`: a stat tile on its own surface with an optional
 *          icon, as placed in a dashboard band (ADR 0307 decision 18).
 * Boundary: types only. Trend, sparkline, target and drill-down come from `Stat`'s props.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decisions 15 and 18); STA-1371.
 */
import type { IconName } from "@stackra/icons/contracts";

import type { StatContractProps } from "#contracts/types/stat-contract-props.type";

/** Props shared by the web and native `Kpi`. */
export interface KpiContractProps extends StatContractProps {
  /** An icon at the tile's start, beside the label. */
  readonly icon?: IconName | undefined;
}
