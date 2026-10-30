/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native ProgressBar: move the bar; the readout says the value.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, ProgressBar, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { PROGRESS_BAR_DEMO_KEYS } from "#src/demos/free/progress-bar/progress-bar-demo-keys.constant";

/** The demo's keys. */
const K = PROGRESS_BAR_DEMO_KEYS.demo_free.progress_bar.live;

/** How far one press moves it. */
const STEP = 10;

/** Add, take away or reset; the readout says what a screen reader hears. */
export default function Live() {
  const [value, setValue] = useState(40);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <ProgressBar value={value} label={t(K.label)} isLabelVisible isValueVisible />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.readout, { value })}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <Button
          size="sm"
          isDisabled={value >= 100}
          onPress={() => setValue((current) => Math.min(100, current + STEP))}
        >
          {t(K.more)}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          isDisabled={value <= 0}
          onPress={() => setValue((current) => Math.max(0, current - STEP))}
        >
          {t(K.less)}
        </Button>
        <Button size="sm" variant="tertiary" onPress={() => setValue(0)}>
          {t(K.reset)}
        </Button>
      </View>
    </View>
  );
}
