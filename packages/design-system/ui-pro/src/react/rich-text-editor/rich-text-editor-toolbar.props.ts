/**
 * Stackra file contract:
 * Purpose: `RichTextEditorToolbarProps`, props of the editor toolbar: the shared contract plus HeroUI Pro's own, with
 *          `aria-label` renamed `label`.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { RichTextEditorToolbarProps as HeroRichTextEditorToolbarProps } from "@heroui-pro/react/rich-text-editor";

import type { RichTextEditorToolbarContractProps } from "#contracts/types/rich-text-editor-toolbar-contract-props.type";

/** Props of the editor toolbar: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type RichTextEditorToolbarProps = RichTextEditorToolbarContractProps &
  Omit<HeroRichTextEditorToolbarProps, keyof RichTextEditorToolbarContractProps | "aria-label">;
