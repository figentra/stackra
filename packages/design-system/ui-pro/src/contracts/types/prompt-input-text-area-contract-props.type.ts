/**
 * Stackra file contract:
 * Purpose: `PromptInputTextAreaContractProps`, props of `PromptInput.TextArea` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `PromptInput.TextArea` that the Stackra vocabulary names. */
export interface PromptInputTextAreaContractProps {
  /** The accessible name of the text area; HeroUI Pro's `aria-label`, "Message input" when left out. */
  readonly label?: string | undefined;
}
