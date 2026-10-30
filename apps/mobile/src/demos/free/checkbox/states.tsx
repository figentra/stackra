/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Checkbox: one checkbox per state; each label says what it shows.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Checkbox, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_DEMO_KEYS } from "#src/demos/free/checkbox/checkbox-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_DEMO_KEYS.demo_free.checkbox.states;

/** Unchecked, checked, indeterminate, disabled, read-only, required, described and invalid. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Checkbox label={t(K.unchecked)} />
      <Checkbox label={t(K.checked)} defaultValue />
      <Checkbox label={t(K.indeterminate)} isIndeterminate />
      <Checkbox label={t(K.disabled)} isDisabled />
      <Checkbox label={t(K.disabled_checked)} isDisabled defaultValue />
      <Checkbox label={t(K.read_only)} isReadOnly defaultValue />
      <Checkbox label={t(K.required)} isRequired />
      <Checkbox label={t(K.described)} description={t(K.description_text)} />
      <Checkbox label={t(K.invalid)} isInvalid errorMessage={t(K.error_text)} />
    </View>
  );
}
