/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native NumberField: the value, and `null` once the field is emptied.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Button, NumberField, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_DEMO_KEYS } from "#src/demos/free/number-field/number-field-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_DEMO_KEYS.demo_free.number_field.live;

/** Type, step, set or clear. */
export default function Live() {
  const [value, setValue] = useState<number | null>(2);
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-3">
      <NumberField label={t(K.label)} value={value} onChange={setValue} minValue={0} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {value === null ? t(K.none) : t(K.value, { value })}
      </Text>
      <Button size="sm" variant="secondary" onPress={() => setValue(4)}>
        {t(K.set)}
      </Button>
      <Button size="sm" variant="tertiary" onPress={() => setValue(null)}>
        {t(K.clear)}
      </Button>
    </View>
  );
}
