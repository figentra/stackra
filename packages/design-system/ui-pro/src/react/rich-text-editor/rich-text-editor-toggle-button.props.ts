/**
 * Stackra file contract:
 * Purpose: `RichTextEditorToggleButtonProps`, props of the editor toggle button: the shared contract plus HeroUI Pro's
 *          own, with `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { RichTextEditorToggleButtonProps as HeroRichTextEditorToggleButtonProps } from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorToggleButtonContractProps } from "#contracts/types/rich-text-editor-toggle-button-contract-props.type";

/** Props of the editor toggle button: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorToggleButtonProps = RichTextEditorToggleButtonContractProps &
  Omit<
    HeroRichTextEditorToggleButtonProps,
    keyof RichTextEditorToggleButtonContractProps | "aria-label"
  >;
