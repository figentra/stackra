/**
 * Stackra file contract:
 * Purpose: the props the web `HoverCard` compound takes from the shared vocabulary: the controlled open state (`isOpen`) and the accessible name of its card.
 * Boundary: types only; web only. Every other prop is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ReactNode } from "react";

/** Props of the `HoverCard` root that the Stackra vocabulary names. */
export interface HoverCardContractProps {
  /** The trigger and the card that opens on hover or focus. */
  readonly children: ReactNode;
  /** The controlled open state; HeroUI Pro's `open`. Uncontrolled when left out. */
  readonly isOpen?: boolean | undefined;
}

/** Props of `HoverCard.Content` that the Stackra vocabulary names. */
export interface HoverCardContentContractProps {
  /** The accessible name of the card, a dialog; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
}
