/**
 * Stackra file contract:
 * Purpose: the props the web `ChainOfThought` compound takes from the shared vocabulary: its children, the trigger
 *          and the content.
 * Boundary: types only; web only. HeroUI Pro's `isStreaming` already follows the vocabulary, and every other prop
 *          is HeroUI Pro's own and passes through unchanged.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of the `ChainOfThought` root. */
export interface ChainOfThoughtContractProps {
  /** The trigger and the collapsible content that holds the reasoning steps. */
  readonly children: ReactNode;
}
