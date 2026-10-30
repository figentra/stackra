/**
 * Stackra file contract:
 * Purpose: the "single" demo of the native Reveal: the content fades in and rises 8 points into place when it mounts.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Card, Reveal, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { REVEAL_DEMO_KEYS } from "#src/demos/free/reveal/reveal-demo-keys.constant";

/** The demo's keys. */
const K = REVEAL_DEMO_KEYS.demo_free.reveal.single;
const R = REVEAL_DEMO_KEYS.demo_free.reveal.replay;

/** Replay mounts it again, over the theme's reveal step. */
export default function Single() {
  const [run, setRun] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Button size="sm" variant="secondary" onPress={() => setRun((count) => count + 1)}>
        {t(R)}
      </Button>
      <Reveal key={run}>
        <Card>
          <Text>{t(K.body)}</Text>
        </Card>
      </Reveal>
    </View>
  );
}
