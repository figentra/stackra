/**
 * Stackra file contract:
 * Purpose: the "dictation" demo of the native VoiceInput: a reply box with a dictate button; the recording is
 *          "transcribed" for a second (the input shows Processing) and the text lands in the box.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           A real app sends the recording to its own speech-to-text service in `onRecord`.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { TextArea, VoiceInput, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { VOICE_INPUT_DEMO_KEYS } from "#src/demos/free/voice-input/voice-input-demo-keys.constant";

/** The demo's keys. */
const K = VOICE_INPUT_DEMO_KEYS.demo_free.voice_input.dictation;

/** How long the pretend transcription takes. */
// oxlint-disable-next-line stackra/no-literal-duration -- a demo's fake transcription delay, not motion
const TRANSCRIBE_MS = 1200;

/** Dictation that adds a transcript to the reply field after a short wait. */
export default function Dictation() {
  const t = useCatalogueText(MESSAGES.en);
  const [reply, setReply] = useState("");
  return (
    <View className="gap-2">
      <TextArea label={t(K.label)} value={reply} onChange={setReply} rows={3} />
      <VoiceInput
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
    </View>
  );
}
