/**
 * Stackra file contract:
 * Purpose: the "contributions" demo of the web RichTextEditor: one contribution, as a package would register it, adds
 *          a toolbar action (tidy spacing, applied as one undoable step) and a side panel with the word count and
 *          reading time.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466 (decisions 3 and 4);
 *          ADR 0350 (UI slots); STA-1371.
 */
import type { Editor } from "@tiptap/core";
import type { RichTextContribution } from "@stackra/ui/react";
import { RichTextEditor, Text, useCatalogueText } from "@stackra/ui/react";
import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_KEYS.rich_text_editor.contributions;

/** Collapses runs of spaces in one transaction, so a single undo puts the text back. */
const tidy = (editor: Editor) => {
  const { tr } = editor.state;
  editor.state.doc.descendants((node, position) => {
    if (!node.isText || node.text === undefined) return;
    for (const match of node.text.matchAll(/ {2,}/g)) {
      const from = position + match.index;
      tr.insertText(" ", tr.mapping.map(from), tr.mapping.map(from + match[0].length));
    }
  });
  editor.view.dispatch(tr);
};

/** The contributed panel: the word count and reading time. */
function WritingPanel({ editor }: { readonly editor: Editor }) {
  const t = useCatalogueText(MESSAGES.en);
  const words = editor.getText().split(/\s+/).filter(Boolean).length;
  return (
    <div className="grid gap-1">
      <Text>{t(K.words, { count: words })}</Text>
      <Text tone="muted">{t(K.reading, { minutes: Math.max(1, Math.ceil(words / 200)) })}</Text>
    </div>
  );
}

/** The contribution a writing package would register, for blog posts only. */
const writing = (tidyLabel: string): RichTextContribution => ({
  id: "demo.writing",
  kinds: ["post"],
  toolbar: [{ id: "tidy", label: tidyLabel, icon: Icons.Sparkles, onPress: tidy }],
  panel: (editor) => <WritingPanel editor={editor} />,
});

/** RichTextEditor: a contributed action and panel. */
export default function Contributions() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-3xl">
      <RichTextEditor
        label={t(K.label)}
        documentKind="post"
        contributions={[writing(t(K.tidy))]}
        defaultValue={{
          type: "doc",
          content: [{ type: "paragraph", content: [{ type: "text", text: t(K.sample) }] }],
        }}
      />
    </div>
  );
}
