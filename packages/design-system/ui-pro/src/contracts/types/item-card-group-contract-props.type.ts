/**
 * Stackra file contract:
 * Purpose: the props the web `ItemCardGroup` root takes from the shared vocabulary: the group's parts.
 * Boundary: types only; web only (HeroUI Pro's ItemCardGroup has no native counterpart). `columns`, `layout` and
 *          `variant` are HeroUI Pro's own and pass through with every other prop.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ReactNode } from "react";

/** Props of the `ItemCardGroup` root. */
export interface ItemCardGroupContractProps {
  /** The group's parts: an optional header, then the item cards. */
  readonly children: ReactNode;
}
