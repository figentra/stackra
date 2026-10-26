/**
 * Stackra file contract:
 * Purpose: `PromptInputActionContractProps`, props of `PromptInput.Action` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */
import type { ReactNode } from "react";

/** Props of `PromptInput.Action` that the Stackra vocabulary names. */
export interface PromptInputActionContractProps {
  /** The accessible name of the icon-only action button; HeroUI Pro's `aria-label`, which it has no default for. */
  readonly label: string;
  /** The icon of the action. */
  readonly children: ReactNode;
}
