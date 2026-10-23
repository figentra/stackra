/**
 * Stackra file contract:
 * Purpose: the props the web `HoloCard` root takes from the shared vocabulary: the card's layers.
 * Boundary: types only; web only (HeroUI Pro's HoloCard has no native counterpart). `isDisabled`, `isInteractive`
 *          and every other prop already follow the vocabulary in HeroUI Pro and pass through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-005.
 */
import type { ReactNode } from "react";

/** Props of the `HoloCard` root. */
export interface HoloCardContractProps {
  /** The card's parts, usually a rotator holding a frame, a surface and the content layers. */
  readonly children: ReactNode;
}
