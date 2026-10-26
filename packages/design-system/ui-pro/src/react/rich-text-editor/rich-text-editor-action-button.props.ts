/**
 * Stackra file contract:
 * Purpose: `RichTextEditorActionButtonProps`, props of the editor action button: the shared contract plus HeroUI Pro's
 *          own, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { RichTextEditorActionButtonProps as HeroRichTextEditorActionButtonProps } from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorActionButtonContractProps } from "#contracts/types/rich-text-editor-action-button-contract-props.type";

/** Props of the editor action button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorActionButtonProps = RichTextEditorActionButtonContractProps &
  Omit<
    HeroRichTextEditorActionButtonProps,
    keyof RichTextEditorActionButtonContractProps | "aria-label"
  >;
