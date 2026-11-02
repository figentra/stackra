/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./rich-text` entry of @stackra/ui, the web `RichTextEditor` and its contribution
 *          types, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. This is the only entry that reaches `@tiptap/*` (optional
 *           peers); `./react` never re-exports it, so a shell that loads `./react` needs no TipTap (STA-1895).
 * Runtime: browser
 * Governing contract: ADR 0294 (decision 15); ADR 0165 (decision 2); ADR 0466 (the editor); STA-1895.
 */
export { RichTextEditor } from "#react/rich-text-editor/rich-text-editor";
export type { RichTextEditorProps } from "#react/rich-text-editor/rich-text-editor.props";
export type { RichTextContribution } from "#react/rich-text-editor/rich-text-contribution.type";
export type { RichTextToolbarItem } from "#react/rich-text-editor/rich-text-toolbar-item.type";
