/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the web VoiceInput: the browser's microphone (the default MediaRecorder driver); once
 *          a note is recorded its length shows under the button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           The browser asks for the microphone on the first press.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Text, VoiceInput, useCatalogueText } from "@stackra/ui/react";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { VOICE_INPUT_KEYS } from "#src/demos/free/voice-input/voice-input-keys.constant";

/** The demo's keys. */
const K = VOICE_INPUT_KEYS.voice_input.basics;

/** Records a voice note and shows how many seconds it lasted. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [seconds, setSeconds] = useState<number | null>(null);
  return (
    <div className="grid justify-items-start gap-3">
      <VoiceInput
        onRecord={(recording) => setSeconds(Math.round(recording.durationMs / 100) / 10)}
      />
      {seconds === null ? null : <Text tone="muted">{t(K.recorded, { seconds })}</Text>}
    </div>
  );
}
