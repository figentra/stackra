/**
 * Stackra file contract:
 * Purpose: the "stagger" demo of the native Reveal: `index` waits one stagger step (40 ms) per place.
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
const K = REVEAL_DEMO_KEYS.demo_free.reveal.stagger;
const R = REVEAL_DEMO_KEYS.demo_free.reveal.replay;

/** The rows of the list. */
const ROWS = ["invoices", "payments", "refunds", "payouts"] as const;

/** A row arrives in order. */
export default function Stagger() {
  const [run, setRun] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Button size="sm" variant="secondary" onPress={() => setRun((count) => count + 1)}>
        {t(R)}
      </Button>
      <View key={run} className="gap-2">
        {ROWS.map((row, index) => (
          <Reveal key={row} index={index}>
            <Card>
              <Text>{t(K[row])}</Text>
            </Card>
          </Reveal>
        ))}
      </View>
    </View>
  );
}
