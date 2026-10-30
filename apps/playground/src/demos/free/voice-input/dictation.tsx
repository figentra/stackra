/**
 * Stackra file contract:
 * Purpose: the "dictation" demo of the web VoiceInput: a reply box with a dictate button; the recording is "transcribed"
 *          for a second (the input shows Processing) and the text lands in the box. The mock driver stands in for the
 *          microphone so the demo runs anywhere.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           A real app sends `recording.data` to its own speech-to-text service in `onRecord`.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { createMockVoiceRecorder } from "@stackra/ui";
import { TextArea, VoiceInput, useCatalogueText } from "@stackra/ui/react";
import { useMemo, useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { VOICE_INPUT_KEYS } from "#src/demos/free/voice-input/voice-input-keys.constant";

/** The demo's keys. */
const K = VOICE_INPUT_KEYS.voice_input.dictation;

/** How long the pretend transcription takes. */
const TRANSCRIBE_MS = 1200;

/** Dictation that adds a transcript to the reply field after a short wait. */
export default function Dictation() {
  const t = useCatalogueText(MESSAGES.en);
  const recorder = useMemo(() => createMockVoiceRecorder(), []);
  const [reply, setReply] = useState("");
  return (
    <div className="grid w-full max-w-lg gap-2">
      <TextArea label={t(K.label)} value={reply} onChange={setReply} rows={3} />
      <VoiceInput
        recorder={recorder}
        label={t(K.dictate)}
        onRecord={() =>
          new Promise<undefined>((resolve) => {
            setTimeout(() => {
              setReply((text) => [text, t(K.transcript)].filter(Boolean).join(" "));
              resolve(undefined);
            }, TRANSCRIBE_MS);
          })
        }
      />
    </div>
  );
}
