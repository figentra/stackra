/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Separator: turn the rule between two blocks.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Separator, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SEPARATOR_DEMO_KEYS } from "#src/demos/free/separator/separator-demo-keys.constant";

/** The demo's keys. */
const K = SEPARATOR_DEMO_KEYS.demo_free.separator.live;

/** Horizontal or vertical, between block A and block B. */
export default function Live() {
  const [isVertical, setIsVertical] = useState(false);
  const t = useCatalogueText(MESSAGES.en);
  const orientation = isVertical ? "vertical" : "horizontal";
  return (
    <View className="items-start gap-3">
      <Button size="sm" variant="secondary" onPress={() => setIsVertical((value) => !value)}>
        {t(K.turn)}
      </Button>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.orientation, { value: orientation })}
      </Text>
      <View className={isVertical ? "h-16 flex-row items-stretch gap-3" : "gap-3 self-stretch"}>
        <Text>{t(K.block_a)}</Text>
        <Separator orientation={orientation} />
        <Text>{t(K.block_b)}</Text>
      </View>
    </View>
  );
}
