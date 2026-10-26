/**
 * Stackra file contract:
 * Purpose: `RichTextEditorProps`, props of the web RichTextEditor: HeroUI Pro's own, whose `isDisabled` already has
 *          the Stackra name.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0310 (decision 3); ADR 0303 (decision 7); STA-416 FR-003.
 */
import type { RichTextEditorProps as HeroRichTextEditorProps } from "@heroui-pro/react/rich-text-editor";

/** Props of the web RichTextEditor: HeroUI Pro's own, whose `isDisabled` already has the Stackra name. */
export type RichTextEditorProps = HeroRichTextEditorProps;
