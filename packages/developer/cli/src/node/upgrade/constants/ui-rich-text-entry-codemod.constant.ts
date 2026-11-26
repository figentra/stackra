/**
 * Stackra file contract:
 * Purpose: `UI_RICH_TEXT_ENTRY_CODEMOD`, 0.4.0: the web `RichTextEditor` and its three types moved from
 *          `@stackra/ui/react` to the new `@stackra/ui/rich-text` entry; the codemod moves the imports.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); STA-145; changeset 149ca06 (STA-1895).
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

const move = (name: string) => ({ name, from: ["@stackra/ui/react"], to: "@stackra/ui/rich-text" });

/** The rich text editor's own entry. */
export const UI_RICH_TEXT_ENTRY_CODEMOD: UpgradeCodemod = {
  id: "ui-rich-text-entry",
  version: "0.4.0",
  title: "RichTextEditor moves from @stackra/ui/react to @stackra/ui/rich-text",
  note: "The web RichTextEditor, RichTextEditorProps, RichTextContribution and RichTextToolbarItem are exported from @stackra/ui/rich-text only, so no other entry imports @tiptap/*. The codemod moves the imports. Only an app that renders the editor needs the optional @tiptap/* peers.",
  source: "149ca06, STA-1895",
  renames: [
    move("RichTextEditor"),
    move("RichTextEditorProps"),
    move("RichTextContribution"),
    move("RichTextToolbarItem"),
  ],
};
