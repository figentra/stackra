/**
 * Stackra file contract:
 * Purpose: the "profile" demo of the native HoverCard: a teammate's profile.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); STA-1371 (wave 3b).
 */
import { Avatar, Button, HoverCard, Stat, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { HOVER_CARD_DEMO_KEYS } from "#src/demos/free/hover-card/hover-card-demo-keys.constant";

/** The demo's keys. */
const K = HOVER_CARD_DEMO_KEYS.demo_free.hover_card.profile;

/** Press the name to preview the profile. */
export default function Profile() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <HoverCard label={t(K.label)} trigger={<Button variant="ghost">{t(K.name)}</Button>}>
      <View className="gap-3">
        <View className="flex-row items-center gap-3">
          <Avatar name={t(K.name)} />
          <View>
            <Text className="font-semibold">{t(K.name)}</Text>
            <Text type="caption" tone="muted">
              {t(K.role)}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-3">
          <Stat label={t(K.orders)} value={1284} />
          <Stat label={t(K.rating)} value="4.9" />
        </View>
      </View>
    </HoverCard>
  );
}
