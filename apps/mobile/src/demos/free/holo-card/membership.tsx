/**
 * Stackra file contract:
 * Purpose: the "membership" demo of the native HoloCard: a loyalty card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { HoloCard, Stat, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { HOLO_CARD_DEMO_KEYS } from "#src/demos/free/holo-card/holo-card-demo-keys.constant";

/** The demo's keys. */
const K = HOLO_CARD_DEMO_KEYS.demo_free.holo_card.membership;

/** A gold loyalty card; drag a finger over it. */
export default function Membership() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <HoloCard>
      <View className="aspect-[1.6] justify-between bg-accent-soft p-5">
        <Text className="text-sm font-semibold">{t(K.tier)}</Text>
        <View className="flex-row items-end justify-between gap-4">
          <View>
            <Text className="text-lg font-semibold">{t(K.name)}</Text>
            <Text type="caption" tone="muted">
              {t(K.since)}
            </Text>
          </View>
          <Stat label={t(K.points)} value={12_480} />
        </View>
      </View>
    </HoloCard>
  );
}
