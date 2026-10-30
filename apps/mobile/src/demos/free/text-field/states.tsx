/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native TextField: required, invalid, disabled and read-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { TextField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TEXT_FIELD_DEMO_KEYS } from "#src/demos/free/text-field/text-field-demo-keys.constant";

/** The demo's keys. */
const K = TEXT_FIELD_DEMO_KEYS.demo_free.text_field.states;

/** Disabled and read-only keep the value. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <TextField label={t(K.required)} isRequired />
      <TextField
        label={t(K.invalid)}
        isInvalid
        errorMessage={t(K.invalid_message)}
        defaultValue={t(K.short_value)}
      />
      <TextField label={t(K.disabled)} isDisabled defaultValue={t(K.kept)} />
      <TextField label={t(K.read_only)} isReadOnly defaultValue={t(K.kept)} />
    </View>
  );
}
