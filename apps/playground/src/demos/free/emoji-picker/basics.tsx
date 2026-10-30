/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web Emoji picker: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { EmojiPicker, Text, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { EMOJI_PICKER_KEYS } from "#src/demos/free/emoji-picker/emoji-picker-keys.constant";

/** The demo's keys. */
const K = EMOJI_PICKER_KEYS.emoji_picker.basics;

/** Emoji picker: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [emoji, setEmoji] = useState<string | null>(null);
  return (
    <div className="grid gap-4">
      <EmojiPicker label={t(K.label)} recent={["👍", "❤️", "🎉"]} onSelect={setEmoji} />
      <Text tone="muted">{emoji ? t(K.chosen, { emoji }) : t(K.none)}</Text>
    </div>
  );
}
