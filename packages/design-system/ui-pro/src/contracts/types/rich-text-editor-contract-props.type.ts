/**
 * Stackra file contract:
 * Purpose: the props the web `RichTextEditor` parts with an accessible name take from the shared vocabulary: the
 *          toolbar, its three kinds of button (format toggle, action and command) and the link popover's trigger take
 *          `label`. The root, which
 *          already names its disabled state `isDisabled`, and every other part are HeroUI Pro's own and pass through
 *          unchanged.
 * Boundary: types only; web only.
 * Runtime: isomorphic
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */

/** Props of `RichTextEditor.Toolbar` that the Stackra vocabulary names. */
export interface RichTextEditorToolbarContractProps {
  /** The accessible name of the toolbar, read by screen readers; HeroUI Pro's `aria-label`, which it defaults. */
  readonly label?: string | undefined;
}

/** Props of `RichTextEditor.ToggleButton` that the Stackra vocabulary names. */
export interface RichTextEditorToggleButtonContractProps {
  /** The accessible name of the button, read by screen readers; HeroUI Pro's `aria-label`, which it defaults from `command`. */
  readonly label?: string | undefined;
}

/** Props of `RichTextEditor.ActionButton` that the Stackra vocabulary names. */
export interface RichTextEditorActionButtonContractProps {
  /** The accessible name of the button, read by screen readers; HeroUI Pro's `aria-label`, which it defaults from `action`. */
  readonly label?: string | undefined;
}

/** Props of `RichTextEditor.LinkPopover.Trigger` that the Stackra vocabulary names. */
export interface RichTextEditorLinkPopoverTriggerContractProps {
  /** The accessible name of the button, read by screen readers; its `aria-label`, "Link" when left out. */
  readonly label?: string | undefined;
}

/** Props of `RichTextEditor.CommandButton` that the Stackra vocabulary names. */
export interface RichTextEditorCommandButtonContractProps {
  /** The accessible name of the button, read by screen readers; HeroUI Pro's `aria-label`. */
  readonly label?: string | undefined;
}
