/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native VoiceInput: the default (mock) recorder; once a note is recorded its length
 *          shows under the button.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           No native audio driver is chosen yet, so the level is made up and no audio is kept.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Text, VoiceInput, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { VOICE_INPUT_DEMO_KEYS } from "#src/demos/free/voice-input/voice-input-demo-keys.constant";

/** The demo's keys. */
const K = VOICE_INPUT_DEMO_KEYS.demo_free.voice_input.basics;

/** Records a voice note and shows how many seconds it lasted. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [seconds, setSeconds] = useState<number | null>(null);
  return (
    <View className="gap-3">
      <VoiceInput
        onRecord={(recording) => setSeconds(Math.round(recording.durationMs / 100) / 10)}
      />
      {seconds === null ? null : <Text tone="muted">{t(K.recorded, { seconds })}</Text>}
    </View>
  );
}
