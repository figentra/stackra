/**
 * Stackra file contract:
 * Purpose: `KpiGroupContractProps`, the props of every runtime's `KpiGroup`: a band of KPIs in one row with dividers
 *          (web) or a two-column grid that wraps (native).
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0307 (decision 18: the Band place); STA-1371.
 */
import type { ReactNode } from "react";

/** Props shared by the web and native `KpiGroup`. */
export interface KpiGroupContractProps {
  /** The KPIs, usually `Stat`s (a group draws one shared surface, so its members need none of their own). */
  readonly children: ReactNode;
  /** The band's accessible name, such as "This month at a glance". */
  readonly label: string;
}
