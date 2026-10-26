/**
 * Stackra file contract:
 * Purpose: `ChatAttachmentRemoveContractProps`, props of `ChatAttachment.Remove` that the Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-002.
 */

/** Props of `ChatAttachment.Remove` that the Stackra vocabulary names. */
export interface ChatAttachmentRemoveContractProps {
  /** The accessible name of the remove button; HeroUI Pro's `aria-label`. HeroUI Pro's own name when left out. */
  readonly label?: string | undefined;
}
