/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the web RichTextEditor: the document lives in state as HTML, a button resets it,
 *          and the HTML the editor reports shows under it as it changes.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466 (decision 5); ADR 0302
 *          (decisions 3 and 5); ADR 0055 (one field contract); STA-1371.
 */
import { Button, CodeBlock, RichTextEditor, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_KEYS.rich_text_editor.controlled;

/** RichTextEditor: a controlled HTML value. */
export default function Controlled() {
  const t = useCatalogueText(MESSAGES.en);
  // The catalogue's words are trusted text; the editor parses any HTML to its schema, dropping what it does not know.
  const start = `<h2>${t(K.heading)}</h2><p>${t(K.body)}</p>`;
  const [html, setHtml] = useState(start);
  return (
    <div className="grid w-full max-w-2xl gap-3">
      <RichTextEditor
        label={t(K.label)}
        format="html"
        value={html}
        onChange={(next) => setHtml(String(next))}
        hasCharacterCount
      />
      <div>
        <Button size="sm" variant="secondary" onPress={() => setHtml(start)}>
          {t(K.reset)}
        </Button>
      </div>
      <CodeBlock title={t(K.output)} language="html" code={html} />
    </div>
  );
}
