/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Checkbox: a parent that is indeterminate while some children are checked.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, Checkbox, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_DEMO_KEYS } from "#src/demos/free/checkbox/checkbox-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_DEMO_KEYS.demo_free.checkbox.live;

/** The children of the parent checkbox. */
const TOPPINGS = ["cheese", "olives", "basil"] as const;

/** Pressing the parent checks every child, or clears them when all are checked. */
export default function Live() {
  const [chosen, setChosen] = useState<readonly string[]>(["cheese"]);
  const t = useCatalogueText(MESSAGES.en);
  const isAll = chosen.length === TOPPINGS.length;
  const toggle = (name: string, isChecked: boolean) =>
    setChosen((list) => (isChecked ? [...list, name] : list.filter((item) => item !== name)));
  return (
    <View className="items-start gap-3">
      <Checkbox
        label={t(K.parent)}
        value={isAll}
        isIndeterminate={chosen.length > 0 && !isAll}
        onChange={() => setChosen(isAll ? [] : [...TOPPINGS])}
      />
      <View className="gap-2 ps-8">
        {TOPPINGS.map((name) => (
          <Checkbox
            key={name}
            label={t(K[name])}
            value={chosen.includes(name)}
            onChange={(isChecked) => toggle(name, isChecked)}
          />
        ))}
      </View>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen.length === 0
          ? t(K.none)
          : t(K.chosen, {
              names: chosen.map((name) => t(K[name as (typeof TOPPINGS)[number]])).join("، "),
            })}
      </Text>
      <Button size="sm" variant="tertiary" onPress={() => setChosen([])}>
        {t(K.clear)}
      </Button>
    </View>
  );
}
