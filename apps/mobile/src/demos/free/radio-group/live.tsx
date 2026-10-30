/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native RadioGroup: the chosen key, and buttons that choose from outside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { Button, RadioGroup, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_DEMO_KEYS } from "#src/demos/free/radio-group/radio-group-demo-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_DEMO_KEYS.demo_free.radio_group.live;

/** A controlled group. */
export default function Live() {
  const [fruit, setFruit] = useState("apple");
  const t = useCatalogueText(MESSAGES.en);
  const fruits: readonly ChoiceOption[] = [
    { value: "apple", label: t(K.apple) },
    { value: "pear", label: t(K.pear) },
    { value: "plum", label: t(K.plum) },
  ];
  return (
    <View className="gap-3">
      <RadioGroup label={t(K.label)} options={fruits} value={fruit} onChange={setFruit} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(K.chosen, { key: fruit })}
      </Text>
      <View className="flex-row gap-2">
        <Button size="sm" variant="secondary" onPress={() => setFruit("apple")}>
          {t(K.pick_apple)}
        </Button>
        <Button size="sm" variant="secondary" onPress={() => setFruit("pear")}>
          {t(K.pick_pear)}
        </Button>
      </View>
    </View>
  );
}
