/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Phone field: Basics.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); wave 3a forms and pickers
 *          (owner approval 2026-10-28); ADR 0060 (light, dark, RTL).
 */
import { PhoneField, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";
import { useState } from "react";

import { MESSAGES } from "#src/constants/messages.constant";
import { PHONE_FIELD_DEMO_KEYS } from "#src/demos/free/phone-field/phone-field-demo-keys.constant";

/** The demo's keys. */
const K = PHONE_FIELD_DEMO_KEYS.demo_free.phone_field.basics;

/** Phone field: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const [phone, setPhone] = useState("");
  return (
    <View className="gap-4">
      <PhoneField
        label={t(K.label)}
        description={t(K.hint)}
        onChange={(next) => setPhone(next?.e164 ?? "")}
      />
      <Text tone="muted">{phone ? t(K.value, { phone }) : null}</Text>
    </View>
  );
}
