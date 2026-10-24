/**
 * Stackra file contract:
 * Purpose: the props the web `ChatMessageActions` compound takes from the shared vocabulary: its children and the
 *          accessible name of each icon-only preset action (copy, regenerate, menu, thumbs up and down).
 * Boundary: types only; web only. HeroUI Pro's `isCopied` already follows the vocabulary. Every other prop is HeroUI
 *          Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChatMessageActions` root. */
export interface ChatMessageActionsContractProps {
  /** The preset actions and any custom `ChatMessage.Action` buttons. */
  readonly children: ReactNode;
}

/** Props of every preset action (`Copy`, `Regenerate`, `Menu`, `ThumbsUp`, `ThumbsDown`) that the vocabulary names. */
export interface ChatMessageActionsPresetContractProps {
  /** The accessible name of the icon-only action; HeroUI Pro's `aria-label`, which its presets have no default for. */
  readonly label: string;
}
