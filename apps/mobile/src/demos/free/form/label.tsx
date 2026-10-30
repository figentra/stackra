/**
 * Stackra file contract:
 * Purpose: the "label" demo of the native Label: each state; the asterisk marks a required field.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Label, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_DEMO_KEYS } from "#src/demos/free/form/form-demo-keys.constant";

/** The demo's keys. */
const K = FORM_DEMO_KEYS.demo_free.form.label;

/** Default, required, invalid and disabled. */
export default function LabelDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <Label>{t(K.default)}</Label>
      <Label isRequired>{t(K.required)}</Label>
      <Label isInvalid>{t(K.invalid)}</Label>
      <Label isDisabled>{t(K.disabled)}</Label>
    </View>
  );
}
