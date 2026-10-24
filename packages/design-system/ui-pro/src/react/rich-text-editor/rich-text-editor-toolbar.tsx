/**
 * Stackra file contract:
 * Purpose: `RichTextEditor.Toolbar` on HeroUI Pro's toolbar: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; `orientation` and the other toolbar props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  RichTextEditor as HeroRichTextEditor,
  type RichTextEditorToolbarProps as HeroRichTextEditorToolbarProps,
} from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorToolbarContractProps } from "#contracts/types/rich-text-editor-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the editor toolbar: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorToolbarProps = RichTextEditorToolbarContractProps &
  Omit<HeroRichTextEditorToolbarProps, keyof RichTextEditorToolbarContractProps | "aria-label">;

/** The editor toolbar: the toolbar that holds the editor's controls. */
export function RichTextEditorToolbar({ label, ...rest }: RichTextEditorToolbarProps) {
  return <HeroRichTextEditor.Toolbar {...rest} {...omitUndefined({ "aria-label": label })} />;
}
