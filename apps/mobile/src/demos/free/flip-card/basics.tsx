/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Flip card: a menu item that turns over to show its details.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Card, FlipCard, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FLIP_CARD_DEMO_KEYS } from "#src/demos/free/flip-card/flip-card-demo-keys.constant";

/** The demo's keys. */
const K = FLIP_CARD_DEMO_KEYS.demo_free.flip_card.sample;

/** Flip card: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <FlipCard
        flipLabel={t(K.flip)}
        front={
          <Card className="h-40 justify-between p-4">
            <Text className="text-lg font-semibold">{t(K.name)}</Text>
            <Text tone="muted">{t(K.price)}</Text>
          </Card>
        }
        back={
          <Card className="h-full gap-2 p-4">
            <Text className="font-semibold">{t(K.details)}</Text>
            <Text type="small" tone="muted">
              {t(K.body)}
            </Text>
          </Card>
        }
      />
      <Text type="caption" tone="muted">
        {t(K.hint)}
      </Text>
    </View>
  );
}
