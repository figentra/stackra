/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native CheckboxGroup: a controlled group and the checked keys in order.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { Button, CheckboxGroup, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_DEMO_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_DEMO_KEYS.demo_free.checkbox_group.live;

/** The readout lists the checked keys in the order they were checked. */
export default function Live() {
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const t = useCatalogueText(MESSAGES.en);
  const toppings: readonly ChoiceOption[] = [
    { value: "cheese", label: t(K.cheese) },
    { value: "olives", label: t(K.olives) },
    { value: "basil", label: t(K.basil) },
  ];
  return (
    <View className="gap-3">
      <CheckboxGroup label={t(K.label)} options={toppings} value={chosen} onChange={setChosen} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen.length === 0 ? t(K.none) : t(K.chosen, { keys: chosen.join(", ") })}
      </Text>
      <View className="flex-row gap-2">
        <Button
          size="sm"
          variant="secondary"
          onPress={() => setChosen(toppings.map(({ value }) => value))}
        >
          {t(K.all)}
        </Button>
        <Button size="sm" variant="tertiary" onPress={() => setChosen([])}>
          {t(K.clear)}
        </Button>
      </View>
    </View>
  );
}
