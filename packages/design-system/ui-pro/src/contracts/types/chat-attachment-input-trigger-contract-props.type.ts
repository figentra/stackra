/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentInputTriggerContractProps`, props of `ChatAttachmentInput.Trigger` that the Stackra
 *          vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `ChatAttachmentInput.Trigger` that the Stackra vocabulary names. */
export interface ChatAttachmentInputTriggerContractProps {
  /** The accessible name of the attach button; HeroUI Pro's `aria-label`; `ui_pro::chat.attach_files` when left out. */
  readonly label?: string | undefined;
  /** Whether the button is disabled; HeroUI Pro's native `disabled`. */
  readonly isDisabled?: boolean | undefined;
}
