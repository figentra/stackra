/**
 * Stackra file contract:
 * Purpose: the props the web `Kpi` compound takes from the shared vocabulary: the card's children, the tone of its
 *          icon and progress bar, and the accessible name of its actions button.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-007.
 */

import type { ReactNode } from "react";

/** Props of the `Kpi` root. */
export interface KpiContractProps {
  /** The card's parts, usually a header, content and footer. */
  readonly children: ReactNode;
}
