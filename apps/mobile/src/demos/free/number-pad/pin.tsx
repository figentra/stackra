/**
 * Stackra file contract:
 * Purpose: the "pin" demo of the native Number pad: a four-digit staff PIN that reports itself complete.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { NumberPad, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_PAD_DEMO_KEYS } from "#src/demos/free/number-pad/number-pad-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_PAD_DEMO_KEYS.demo_free.number_pad.sample;

/** Number pad: PIN. */
export default function Pin() {
  const t = useCatalogueText(MESSAGES.en);
  const [pin, setPin] = useState("");
  return (
    <View className="gap-3">
      <Text type="small" tone="muted" accessibilityLiveRegion="polite" className="text-center">
        {pin.length === 4 ? t(K.complete) : t(K.enter)}
      </Text>
      <NumberPad label={t(K.pin)} isPin value={pin} onChange={setPin} />
    </View>
  );
}
