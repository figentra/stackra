/**
 * Stackra file contract:
 * Purpose: the props the web `KpiGroup` root takes from the shared vocabulary: the `Kpi` cards it groups.
 * Boundary: types only; web only (HeroUI Pro's KPIGroup has no native counterpart). `orientation` and every other
 *          prop are HeroUI Pro's own and pass through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ReactNode } from "react";

/** Props of the `KpiGroup` root. */
export interface KpiGroupContractProps {
  /** The grouped `Kpi` cards, with `KpiGroup.Separator` between them where wanted. */
  readonly children: ReactNode;
}
