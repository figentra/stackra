/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native NumberField: required, invalid, disabled and read-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { NumberField, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NUMBER_FIELD_DEMO_KEYS } from "#src/demos/free/number-field/number-field-demo-keys.constant";

/** The demo's keys. */
const K = NUMBER_FIELD_DEMO_KEYS.demo_free.number_field.states;

/** Read-only is not announced as disabled. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <NumberField label={t(K.required)} isRequired />
      <NumberField
        label={t(K.invalid)}
        isInvalid
        defaultValue={0}
        errorMessage={t(K.invalid_error)}
      />
      <NumberField label={t(K.disabled)} isDisabled defaultValue={7} />
      <NumberField label={t(K.read_only)} isReadOnly defaultValue={7} />
    </View>
  );
}
