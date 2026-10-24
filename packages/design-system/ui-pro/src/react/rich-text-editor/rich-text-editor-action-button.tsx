/**
 * Stackra file contract:
 * Purpose: `RichTextEditor.ActionButton` on HeroUI Pro's action button: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; `action`, `tooltip`, `size` and `variant` are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  RichTextEditor as HeroRichTextEditor,
  type RichTextEditorActionButtonProps as HeroRichTextEditorActionButtonProps,
} from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorActionButtonContractProps } from "#contracts/types/rich-text-editor-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the editor action button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorActionButtonProps = RichTextEditorActionButtonContractProps &
  Omit<
    HeroRichTextEditorActionButtonProps,
    keyof RichTextEditorActionButtonContractProps | "aria-label"
  >;

/** The editor action button: a button that runs an editor action such as undo. */
export function RichTextEditorActionButton({ label, ...rest }: RichTextEditorActionButtonProps) {
  return <HeroRichTextEditor.ActionButton {...rest} {...omitUndefined({ "aria-label": label })} />;
}
