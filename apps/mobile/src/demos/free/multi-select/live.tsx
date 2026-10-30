/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native MultiSelect: pick dietary tags with a selection haptic and clear them from outside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 4; ADR 0310
 *          (decision 6).
 */
import { Button, MultiSelect, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MULTI_SELECT_DEMO_KEYS } from "#src/demos/free/multi-select/multi-select-demo-keys.constant";

/** The demo's keys. */
const K = MULTI_SELECT_DEMO_KEYS.demo_free.multi_select.live;

/** Pick, count and clear. */
export default function Live() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState<readonly string[]>(["halal"]);
  const items = [
    { id: "halal", label: t(K.halal) },
    { id: "vegan", label: t(K.vegan) },
    { id: "gluten", label: t(K.gluten) },
    { id: "spicy", label: t(K.spicy) },
    { id: "nuts", label: t(K.nuts) },
  ];
  return (
    <View className="gap-3">
      <MultiSelect
        label={t(K.dietary)}
        items={items}
        removeLabel={(label) => t(K.remove, { label })}
        value={chosen}
        onChange={setChosen}
      />
      <Text accessibilityLiveRegion="polite">{t(K.chosen, { count: chosen.length })}</Text>
      <Button size="sm" variant="tertiary" onPress={() => setChosen([])}>
        {t(K.clear)}
      </Button>
    </View>
  );
}
