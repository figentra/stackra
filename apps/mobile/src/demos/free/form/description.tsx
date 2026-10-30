/**
 * Stackra file contract:
 * Purpose: the "description" demo of the native Description: help text under a field, read out with it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Description, Label, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { FORM_DEMO_KEYS } from "#src/demos/free/form/form-demo-keys.constant";

/** The demo's keys. */
const K = FORM_DEMO_KEYS.demo_free.form.description;

/** A label and its help text. */
export default function DescriptionDemo() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-1">
      <Label>{t(K.field)}</Label>
      <Description>{t(K.hint)}</Description>
    </View>
  );
}
