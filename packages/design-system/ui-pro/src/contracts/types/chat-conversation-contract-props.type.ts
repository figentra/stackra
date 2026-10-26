/**
 * Stackra file contract:
 * Purpose: the props the web `ChatConversation` compound takes from the shared vocabulary: its children, the
 *          accessible name of the thread and that of the scroll-to-bottom button.
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
  /** The accessible name of the thread, a scrolling region the keyboard reaches; its `aria-label`. */
  readonly label: string;
}
