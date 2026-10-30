/**
 * Stackra file contract:
 * Purpose: the "hero" demo of the native TextReveal: a hero headline whose words fade in one after another, with a
 *          button that plays it again.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0329.
 */
import { Button, TextReveal, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_REVEAL_DEMO_KEYS } from "#src/demos/free/text-reveal/text-reveal-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_REVEAL_DEMO_KEYS.demo_free.text_reveal.hero;

/** A headline revealed word by word, replayable. */
export default function Hero() {
  const t = useCatalogueText(MESSAGES.en);
  const [play, setPlay] = useState(0);
  return (
    <View className="items-start gap-4">
      <TextReveal key={play}>{t(K.headline)}</TextReveal>
      <Button size="sm" variant="secondary" onPress={() => setPlay((count) => count + 1)}>
        {t(K.replay)}
      </Button>
    </View>
  );
}
