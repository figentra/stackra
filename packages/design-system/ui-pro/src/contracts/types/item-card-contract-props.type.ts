/**
 * Stackra file contract:
 * Purpose: the props the web `ItemCard` root takes from the shared vocabulary: the card's parts.
 * Boundary: types only; web only (HeroUI Pro's ItemCard has no native counterpart). `variant` is a surface style
 *          there, not a colour role, so it stays HeroUI Pro's own and passes through with every other prop.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ReactNode } from "react";

/** Props of the `ItemCard` root. */
export interface ItemCardContractProps {
  /** The card's parts: an icon, the content with its title and description, and an action. */
  readonly children: ReactNode;
}
