/**
 * Stackra file contract:
 * Purpose: `RichTextEditorCommandButtonProps`, props of the editor command button: the shared contract plus HeroUI
 *          Pro's own, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { RichTextEditorCommandButtonProps as HeroRichTextEditorCommandButtonProps } from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorCommandButtonContractProps } from "#contracts/types/rich-text-editor-command-button-contract-props.type";

/** Props of the editor command button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorCommandButtonProps = RichTextEditorCommandButtonContractProps &
  Omit<
    HeroRichTextEditorCommandButtonProps,
    keyof RichTextEditorCommandButtonContractProps | "aria-label"
  >;
