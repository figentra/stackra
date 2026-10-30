/**
 * Stackra file contract:
 * Purpose: the "formats" demo of the native NumberField: `formatOptions` for a percentage and for money.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { NumberField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_DEMO_KEYS } from "#src/demos/free/number-field/number-field-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_DEMO_KEYS.demo_free.number_field.formats;

/** A percentage is held as a fraction and steps by one point; money shows its symbol. */
export default function Formats() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <NumberField
        label={t(K.percent)}
        description={t(K.percent_hint)}
        defaultValue={0.25}
        minValue={0}
        maxValue={1}
        formatOptions={{ style: "percent" }}
      />
      <NumberField
        label={t(K.currency)}
        description={t(K.currency_hint)}
        defaultValue={19.99}
        minValue={0}
        formatOptions={{ style: "currency", currency: "USD" }}
      />
    </View>
  );
}
