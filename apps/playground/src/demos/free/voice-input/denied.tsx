/**
 * Stackra file contract:
 * Purpose: the "denied" demo of the web VoiceInput: a recorder that is refused the microphone, so a press shows the
 *          blocked state and how to fix it.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { createMockVoiceRecorder } from "@stackra/ui";
import { Text, VoiceInput, useCatalogueText } from "@stackra/ui/react";
import { useMemo } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { VOICE_INPUT_KEYS } from "#src/demos/free/voice-input/voice-input-keys.constant";

/** The demo's keys. */
const K = VOICE_INPUT_KEYS.voice_input.denied;

/** VoiceInput: Access denied. */
export default function Denied() {
  const t = useCatalogueText(MESSAGES.en);
  const recorder = useMemo(() => createMockVoiceRecorder({ deny: true }), []);
  return (
    <div className="grid w-full max-w-lg gap-2">
      <Text tone="muted">{t(K.hint)}</Text>
      <VoiceInput recorder={recorder} label={t(K.label)} />
    </div>
  );
}
