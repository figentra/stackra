/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Chip: step through variants and tones; the chip says what it is.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Enum, Tone } from "@stackra/contracts";
import { ChipVariant } from "@stackra/ui/contracts";
import { Button, Chip, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHIP_DEMO_KEYS } from "#src/demos/free/chip/chip-demo-keys.constant";

/** The demo's keys. */
const K = CHIP_DEMO_KEYS.demo_free.chip.live;

/** Next variant and Next tone change one chip. */
export default function Live() {
  const [variantIndex, setVariantIndex] = useState(0);
  const [toneIndex, setToneIndex] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  const variant = ChipVariant[variantIndex % ChipVariant.length] ?? "secondary";
  const tone = Enum.values(Tone)[toneIndex % Enum.values(Tone).length] ?? "default";
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        <Button size="sm" variant="secondary" onPress={() => setVariantIndex((index) => index + 1)}>
          {t(K.next_variant)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setToneIndex((index) => index + 1)}>
          {t(K.next_tone)}
        </Button>
      </View>
      <View className="items-start" accessibilityLiveRegion="polite">
        <Chip variant={variant} tone={tone}>
          {t(K.current, { variant, tone })}
        </Chip>
      </View>
    </View>
  );
}
