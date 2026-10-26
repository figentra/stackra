/**
 * Stackra file contract:
 * Purpose: `ChatConversationScrollButtonContractProps`, props of `ChatConversation.ScrollButton` that the Stackra
 *          vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `ChatConversation.ScrollButton` that the Stackra vocabulary names. */
export interface ChatConversationScrollButtonContractProps {
  /** The accessible name of the icon-only button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
}
