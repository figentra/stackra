/**
 * Stackra file contract:
 * Purpose: the "continue" demo of the web tamo-ghost-text: a suggestion after the note's text: Tab takes it, Escape drops it.
 * Boundary: a demo with no props: @stackra/ui, @stackra/ai's offline mock client and local state only; every word
 *           from the catalogue. The same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          ADR 0507 (Ask Tamo).
 */
import { TamoGhostText, Button, Text, TextArea, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { TAMO_GHOST_TEXT_KEYS } from "#src/demos/free/tamo-ghost-text/tamo-ghost-text-keys.constant";

/** The demo's keys. */
const K = TAMO_GHOST_TEXT_KEYS.tamo_ghost_text;

/** Tamo ghost text: continue writing. */
export default function Continue() {
  const t = useCatalogueText(MESSAGES.en);
  const [text, setText] = useState(t(K.text));
  const [suggestion, setSuggestion] = useState(t(K.suggestion));
  return (
    <div className="grid max-w-md gap-3">
      <TamoGhostText
        value={text}
        suggestion={suggestion}
        onAccept={(next) => {
          setText(next);
          setSuggestion("");
        }}
        onDismiss={() => setSuggestion("")}
      >
        <TextArea
          aria-label={t(K.label)}
          value={text}
          onChange={(next) => {
            setText(next);
            setSuggestion("");
          }}
          rows={3}
          ai={false}
        />
      </TamoGhostText>
      <div className="flex items-center gap-3">
        <Button size="sm" variant="secondary" onPress={() => setSuggestion(t(K.suggestion))}>
          {t(K.again)}
        </Button>
        <Text type="small" tone="muted">
          <bdi>{t(K.kept, { text })}</bdi>
        </Text>
      </div>
    </div>
  );
}
