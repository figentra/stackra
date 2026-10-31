/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the web RichTextEditor: a product description with the full toolbar, a placeholder and
 *          a character count against a limit.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466; ADR 0302 (decisions 3
 *          and 5); ADR 0060 (light, dark, RTL); STA-1371.
 */
import { RichTextEditor, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_KEYS.rich_text_editor.basic;

/** RichTextEditor: a product description. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="w-full max-w-2xl">
      <RichTextEditor
        label={t(K.label)}
        placeholder={t(K.placeholder)}
        description={t(K.description)}
        characterLimit={600}
      />
    </div>
  );
}
