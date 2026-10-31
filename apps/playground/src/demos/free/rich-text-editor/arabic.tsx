/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web RichTextEditor: an Arabic product description in a right-to-left page; each
 *          paragraph takes its direction from its own text, so an English line typed in keeps its own start.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466 (decision 8); ADR 0060
 *          (right-to-left); STA-1371.
 */
import type { RichTextNode } from "@stackra/ui/contracts";
import { RichTextEditor, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_KEYS.rich_text_editor.arabic;

/** RichTextEditor: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  const document: RichTextNode = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: t(K.heading) }] },
      { type: "paragraph", content: [{ type: "text", text: t(K.body) }] },
    ],
  };
  return (
    <div dir="rtl" lang="ar" data-sample="arabic" className="w-full max-w-2xl">
      <RichTextEditor
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        defaultValue={document}
        hasCharacterCount
      />
    </div>
  );
}
