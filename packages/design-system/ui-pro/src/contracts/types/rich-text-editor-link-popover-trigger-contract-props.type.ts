/**
 * Stackra file contract:
 * Purpose: `RichTextEditorLinkPopoverTriggerContractProps`, props of `RichTextEditor.LinkPopover.Trigger` that the
 *          Stackra vocabulary names.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `RichTextEditor.LinkPopover.Trigger` that the Stackra vocabulary names. */
export interface RichTextEditorLinkPopoverTriggerContractProps {
  /** The accessible name of the button, read by screen readers; its `aria-label`, "Link" when left out. */
  readonly label?: string | undefined;
}
