/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Time field: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { TimeField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TIME_FIELD_DEMO_KEYS } from "#src/demos/free/time-field/time-field-demo-keys.constant";

/** The demo's keys. */
const K = TIME_FIELD_DEMO_KEYS.demo_free.time_field.basics;

/** Time field: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <TimeField
        label={t(K.open)}
        description={t(K.open_hint)}
        defaultValue={{ hour: 9, minute: 0 }}
      />
      <TimeField label={t(K.close)} hourCycle={24} defaultValue={{ hour: 23, minute: 30 }} />
    </View>
  );
}
