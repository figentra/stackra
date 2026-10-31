/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the native RichTextEditor: an Arabic product description with an English sentence in
 *          it, each block laid out by its own text and the toolbar mirrored with the app.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466 (decision 8); ADR 0060;
 *          STA-1371.
 */
import type { RichTextNode } from "@stackra/ui/contracts";
import { RichTextEditor, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_DEMO_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-demo-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_DEMO_KEYS.demo_free.rich_text_editor.arabic;

/** RichTextEditor: Arabic. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  const document: RichTextNode = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: t(K.heading) }] },
      { type: "paragraph", content: [{ type: "text", text: t(K.body) }] },
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [{ type: "paragraph", content: [{ type: "text", text: t(K.item) }] }],
          },
        ],
      },
    ],
  };
  return (
    <RichTextEditor
      label={t(K.label)}
      placeholder={t(K.placeholder)}
      defaultValue={document}
      hasCharacterCount
    />
  );
}
