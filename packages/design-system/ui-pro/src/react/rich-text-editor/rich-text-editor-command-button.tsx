/**
 * Stackra file contract:
 * Purpose: `RichTextEditor.CommandButton` on HeroUI Pro's command button: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; `onCommand`, `isActive`, `isDisabled` and `tooltip` are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  RichTextEditor as HeroRichTextEditor,
  type RichTextEditorCommandButtonProps as HeroRichTextEditorCommandButtonProps,
} from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorCommandButtonContractProps } from "#contracts/types/rich-text-editor-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the editor command button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorCommandButtonProps = RichTextEditorCommandButtonContractProps &
  Omit<
    HeroRichTextEditorCommandButtonProps,
    keyof RichTextEditorCommandButtonContractProps | "aria-label"
  >;

/** The editor command button: a button that runs your own Tiptap command. */
export function RichTextEditorCommandButton({ label, ...rest }: RichTextEditorCommandButtonProps) {
  return <HeroRichTextEditor.CommandButton {...rest} {...omitUndefined({ "aria-label": label })} />;
}
