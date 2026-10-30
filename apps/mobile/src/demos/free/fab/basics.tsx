/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Floating action button: one main action floating at the reading end of an area.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Fab, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FAB_DEMO_KEYS } from "#src/demos/free/fab/fab-demo-keys.constant";

/** The demo's keys. */
const K = FAB_DEMO_KEYS.demo_free.fab.sample;

/** Floating action button: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [count, setCount] = useState(0);
  return (
    <View className="h-56 rounded-2xl border border-dashed border-border p-4">
      <Text type="small" tone="muted" accessibilityLiveRegion="polite">
        {t(K.area)} · {count}
      </Text>
      <Fab label={t(K.new_order)} isExtended onPress={() => setCount((value) => value + 1)} />
    </View>
  );
}
