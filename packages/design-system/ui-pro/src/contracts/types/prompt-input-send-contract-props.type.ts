/**
 * Stackra file contract:
 * Purpose: `PromptInputSendContractProps`, props of `PromptInput.Send` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `PromptInput.Send` that the Stackra vocabulary names. */
export interface PromptInputSendContractProps {
  /** The accessible name of the icon-only send button; HeroUI Pro's `aria-label`, "Send message" or "Stop" when left out. */
  readonly label?: string | undefined;
  /** Whether the button shows its busy state; HeroUI Pro's `isPending`. */
  readonly isLoading?: boolean | undefined;
}
