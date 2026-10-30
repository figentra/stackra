/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Switch: three settings; the readout lists the ones that are on.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Switch, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SWITCH_DEMO_KEYS } from "#src/demos/free/switch/switch-demo-keys.constant";

/** The demo's keys. */
const K = SWITCH_DEMO_KEYS.demo_free.switch.live;

/** The settings. */
const SETTINGS = ["dark_keyboard", "sounds", "vibration"] as const;

/** Turn settings on and off. */
export default function Live() {
  const [on, setOn] = useState<readonly (typeof SETTINGS)[number][]>(["sounds"]);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      {SETTINGS.map((name) => (
        <Switch
          key={name}
          label={t(K[name])}
          value={on.includes(name)}
          onChange={(isOn) =>
            setOn((list) => (isOn ? [...list, name] : list.filter((item) => item !== name)))
          }
        />
      ))}
      <Text tone="muted" accessibilityLiveRegion="polite">
        {on.length === 0
          ? t(K.none)
          : t(K.summary, { names: on.map((name) => t(K[name])).join(t(K.separator)) })}
      </Text>
    </View>
  );
}
