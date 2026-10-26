/**
 * Stackra file contract:
 * Purpose: `ChatMessageActionsPresetContractProps`, props of every preset action (`Copy`, `Regenerate`, `Menu`,
 *          `ThumbsUp`, `ThumbsDown`) that the vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of every preset action (`Copy`, `Regenerate`, `Menu`, `ThumbsUp`, `ThumbsDown`) that the vocabulary names. */
export interface ChatMessageActionsPresetContractProps {
  /** The accessible name of the icon-only action; HeroUI Pro's `aria-label`, which its presets have no default for. */
  readonly label: string;
}
