/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Icon: the buttons step the icon through sizes and tones.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Size, TextTone } from "@stackra/ui/contracts";
import { Button, Icon, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_DEMO_KEYS } from "#src/demos/free/icon/icon-demo-keys.constant";

/** The demo's keys. */
const K = ICON_DEMO_KEYS.demo_free.icon.live;

/** Next size and Next tone change one icon. */
export default function Live() {
  const [sizeIndex, setSizeIndex] = useState(1);
  const [toneIndex, setToneIndex] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  const size = Size[sizeIndex % Size.length] ?? "md";
  const tone = TextTone[toneIndex % TextTone.length] ?? "default";
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={() => setSizeIndex((index) => index + 1)}>
          {t(K.next_size)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setToneIndex((index) => index + 1)}>
          {t(K.next_tone)}
        </Button>
      </View>
      <View className="flex-row items-center gap-3">
        <Icon name="star" size={size} tone={tone} />
        <Text tone="muted" accessibilityLiveRegion="polite">
          {t(K.state, { size, tone })}
        </Text>
      </View>
    </View>
  );
}
