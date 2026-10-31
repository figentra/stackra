/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the native RichTextEditor: a product description with a placeholder and a character
 *          count, on the TipTap-based native editor (ADR 0466 decision 1).
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466; ADR 0302 (decision 3);
 *          ADR 0060; STA-1371.
 */
import { RichTextEditor, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_DEMO_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-demo-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_DEMO_KEYS.demo_free.rich_text_editor.basic;

/** RichTextEditor: a product description. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <RichTextEditor
      label={t(K.label)}
      placeholder={t(K.placeholder)}
      description={t(K.description)}
      characterLimit={600}
    />
  );
}
