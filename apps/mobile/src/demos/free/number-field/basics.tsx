/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native NumberField: a label with a placeholder, and one with a description.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { NumberField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_DEMO_KEYS } from "#src/demos/free/number-field/number-field-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_DEMO_KEYS.demo_free.number_field.basics;

/** Quantity and weight. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <NumberField label={t(K.quantity)} placeholder={t(K.placeholder)} />
      <NumberField
        label={t(K.weight)}
        description={t(K.hint)}
        defaultValue={2.5}
        step={0.25}
        minValue={0}
      />
    </View>
  );
}
