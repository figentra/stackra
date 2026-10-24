/**
 * Stackra file contract:
 * Purpose: `RichTextEditor.ToggleButton` on HeroUI Pro's format toggle button: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; `command`, `tooltip`, `size` and `variant` are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import {
  RichTextEditor as HeroRichTextEditor,
  type RichTextEditorToggleButtonProps as HeroRichTextEditorToggleButtonProps,
} from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorToggleButtonContractProps } from "#contracts/types/rich-text-editor-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/** Props of the editor toggle button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorToggleButtonProps = RichTextEditorToggleButtonContractProps &
  Omit<
    HeroRichTextEditorToggleButtonProps,
    keyof RichTextEditorToggleButtonContractProps | "aria-label"
  >;

/** The editor toggle button: a button that toggles a format on the selection. */
export function RichTextEditorToggleButton({ label, ...rest }: RichTextEditorToggleButtonProps) {
  return <HeroRichTextEditor.ToggleButton {...rest} {...omitUndefined({ "aria-label": label })} />;
}
