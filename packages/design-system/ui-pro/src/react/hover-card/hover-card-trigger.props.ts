/**
 * Stackra file contract:
 * Purpose: `HoverCardTriggerProps`, props of `HoverCard.Trigger`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-004.
 */
import type { ReactElement } from "react";

/** Props of `HoverCard.Trigger`. */
export interface HoverCardTriggerProps {
  /** The one element that opens the card on hover or focus: a React Aria link or button, such as HeroUI's `Link`. */
  readonly children: ReactElement;
}
