/**
 * Stackra file contract:
 * Purpose: the "inside" demo of the native Reveal: inside a surface, around its content, never around the surface.
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
const K = REVEAL_DEMO_KEYS.demo_free.reveal.inside;
const R = REVEAL_DEMO_KEYS.demo_free.reveal.replay;

/** Liquid Glass breaks when a parent changes opacity, so the card stays put. */
export default function Inside() {
  const [run, setRun] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Button size="sm" variant="secondary" onPress={() => setRun((count) => count + 1)}>
        {t(R)}
      </Button>
      <Card>
        <Reveal key={run}>
          <View className="gap-1">
            <Text type="small" tone="muted">
              {t(K.heading)}
            </Text>
            <Text>{t(K.body)}</Text>
          </View>
        </Reveal>
      </Card>
    </View>
  );
}
