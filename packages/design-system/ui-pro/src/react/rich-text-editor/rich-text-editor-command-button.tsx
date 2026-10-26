/**
 * Stackra file contract:
 * Purpose: `RichTextEditor.CommandButton` on HeroUI Pro's command button: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; `onCommand`, `isActive`, `isDisabled` and `tooltip` are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import { RichTextEditor as HeroRichTextEditor } from "@heroui-pro/react/rich-text-editor";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { RichTextEditorCommandButtonProps } from "#react/rich-text-editor/rich-text-editor-command-button.props";

/** The editor command button: a button that runs your own Tiptap command. */
export function RichTextEditorCommandButton({ label, ...rest }: RichTextEditorCommandButtonProps) {
  return <HeroRichTextEditor.CommandButton {...rest} {...omitUndefined({ "aria-label": label })} />;
}
