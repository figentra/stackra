/**
 * Stackra file contract:
 * Purpose: the "off" demo of the native Reveal: `isAnimated={false}` shows the content at once, as reduce motion does.
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
const K = REVEAL_DEMO_KEYS.demo_free.reveal.off;
const R = REVEAL_DEMO_KEYS.demo_free.reveal.replay;

/** No entrance. */
export default function Off() {
  const [run, setRun] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Button size="sm" variant="secondary" onPress={() => setRun((count) => count + 1)}>
        {t(R)}
      </Button>
      <Reveal key={run} isAnimated={false}>
        <Card>
          <Text>{t(K.body)}</Text>
        </Card>
      </Reveal>
    </View>
  );
}
