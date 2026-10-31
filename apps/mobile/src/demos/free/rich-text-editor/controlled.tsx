/**
 * Stackra file contract:
 * Purpose: the "controlled" demo of the native RichTextEditor: a controlled JSON document with a reset button and the
 *          JSON it reports, the same shape the web editor writes, so a document round-trips between web and mobile.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0466 (decisions 1 and 2);
 *          STA-1371.
 */
import type { RichTextNode } from "@stackra/ui/contracts";
import { Button, CodeBlock, RichTextEditor, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RICH_TEXT_EDITOR_DEMO_KEYS } from "#src/demos/free/rich-text-editor/rich-text-editor-demo-keys.constant";

/** The demo's keys. */
const K = RICH_TEXT_EDITOR_DEMO_KEYS.demo_free.rich_text_editor.controlled;

/** RichTextEditor: a controlled JSON document. */
export default function Controlled() {
  const t = useCatalogueText(MESSAGES.en);
  const start: RichTextNode = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: t(K.heading) }] },
      { type: "paragraph", content: [{ type: "text", text: t(K.body) }] },
    ],
  };
  const [document, setDocument] = useState<RichTextNode | string>(start);
  return (
    <View className="w-full gap-3">
      <RichTextEditor
        label={t(K.label)}
        value={document}
        onChange={setDocument}
        hasCharacterCount
      />
      <View className="items-start">
        <Button size="sm" variant="secondary" onPress={() => setDocument(start)}>
          {t(K.reset)}
        </Button>
      </View>
      <CodeBlock title={t(K.output)} language="json" code={JSON.stringify(document, null, 2)} />
    </View>
  );
}
