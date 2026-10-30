/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Tooltip: the tooltip does not change what a press does; presses are counted.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 *           A phone has no hover: the tooltip is the element's accessibility hint, so the caption repeats it.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Text, Tooltip, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TOOLTIP_DEMO_KEYS } from "#src/demos/free/tooltip/tooltip-demo-keys.constant";

/** The demo's keys. */
const K = TOOLTIP_DEMO_KEYS.demo_free.tooltip.live;

/** Press the button; the readout counts. */
export default function Live() {
  const [count, setCount] = useState(0);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <Tooltip content={t(K.hint)}>
        <Button variant="secondary" onPress={() => setCount((value) => value + 1)}>
          {t(K.button)}
        </Button>
      </Tooltip>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.pressed, { count })}
      </Text>
    </View>
  );
}
