/**
 * Stackra file contract:
 * Purpose: `RichTextEditorActionButtonContractProps`, props of `RichTextEditor.ActionButton` that the Stackra
 *          vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `RichTextEditor.ActionButton` that the Stackra vocabulary names. */
export interface RichTextEditorActionButtonContractProps {
  /** The accessible name of the button, read by screen readers; HeroUI Pro's `aria-label`, which it defaults from `action`. */
  readonly label?: string | undefined;
}
