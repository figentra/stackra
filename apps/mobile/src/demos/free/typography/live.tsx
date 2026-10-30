/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native `Text`: a button steps the line through every `tone`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); STA-416 FR-013.
 */
import { TextTone } from "@stackra/ui/contracts";
import { Button, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TYPOGRAPHY_DEMO_KEYS } from "#src/demos/free/typography/typography-demo-keys.constant";

/** The demo's keys. */
const K = TYPOGRAPHY_DEMO_KEYS.demo_free.typography.live;

/** Press to move to the next tone; the line says which. */
export default function Live() {
  const [toneIndex, setToneIndex] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  const tone = TextTone[toneIndex % TextTone.length] ?? "default";
  return (
    <View className="items-start gap-3">
      <Button size="sm" variant="secondary" onPress={() => setToneIndex((index) => index + 1)}>
        {t(K.next_tone)}
      </Button>
      <Text tone={tone} accessibilityLiveRegion="polite">
        {t(K.state, { tone })}
      </Text>
    </View>
  );
}
