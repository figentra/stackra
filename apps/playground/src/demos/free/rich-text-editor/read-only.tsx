/**
 * Stackra file contract:
 * Purpose: the "read-only" demo of the web RichTextEditor: a published help article shown with its formatting and no
 *          toolbar; the text can be selected and copied but not changed.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466 (decision 2); ADR 0302
 *          (decisions 3 and 5); STA-1371.
 */
import type { RichTextNode } from "@stackra/ui/contracts";
import { RichTextEditor, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_KEYS.rich_text_editor.read_only;

/** A paragraph node of `text`. */
const paragraph = (text: string): RichTextNode => ({
  type: "paragraph",
  content: [{ type: "text", text }],
});

/** RichTextEditor: read-only. */
export default function ReadOnly() {
  const t = useCatalogueText(MESSAGES.en);
  const document: RichTextNode = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: t(K.heading) }] },
      paragraph(t(K.body)),
      {
        type: "orderedList",
        content: [
          { type: "listItem", content: [paragraph(t(K.item_1))] },
          { type: "listItem", content: [paragraph(t(K.item_2))] },
        ],
      },
    ],
  };
  return (
    <div className="w-full max-w-2xl">
      <RichTextEditor label={t(K.label)} defaultValue={document} isReadOnly />
    </div>
  );
}
