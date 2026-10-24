/**
 * Stackra file contract:
 * Purpose: the props the web `PromptSuggestion` compound takes from the shared vocabulary: its children, the header
 *          and the items.
 * Boundary: types only; web only. HeroUI Pro's `variant` (`pill` or `card`) picks a layout, not a colour role, so it
 *          keeps its name, as does every other prop, and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `PromptSuggestion` root. */
export interface PromptSuggestionContractProps {
  /** The header and the items, or the groups of items. */
  readonly children: ReactNode;
}
