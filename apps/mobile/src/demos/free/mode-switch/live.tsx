/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native ModeSwitch: `onModeChange` reports `normal` or `developer`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ModeSwitch, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MODE_SWITCH_DEMO_KEYS } from "#src/demos/free/mode-switch/mode-switch-demo-keys.constant";

/** The demo's keys. */
const K = MODE_SWITCH_DEMO_KEYS.demo_free.mode_switch.live;

/** The readout names the current mode. */
export default function Live() {
  const [mode, setMode] = useState<"normal" | "developer">("normal");
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <ModeSwitch label={t(K.label)} description={t(K.help)} mode={mode} onModeChange={setMode} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.current, { mode })}
      </Text>
    </View>
  );
}
