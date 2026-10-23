/**
 * Stackra file contract:
 * Purpose: the props the web `ChatConversation` compound takes from the shared vocabulary: its children and the
 *          accessible name of the scroll-to-bottom button.
 * Boundary: types only; web only. Every other prop (`initial`, `resize`, `tooltip`, the div props) is HeroUI Pro's
 *          own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatConversation` root. */
export interface ChatConversationContractProps {
  /** The scrolling content and the scroll button. */
  readonly children: ReactNode;
}

/** Props of `ChatConversation.ScrollButton` that the Stackra vocabulary names. */
export interface ChatConversationScrollButtonContractProps {
  /** The accessible name of the icon-only button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
}
