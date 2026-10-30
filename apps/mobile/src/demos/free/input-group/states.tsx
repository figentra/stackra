/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native InputGroup: required, invalid, disabled and read-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { InputGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { INPUT_GROUP_DEMO_KEYS } from "#src/demos/free/input-group/input-group-demo-keys.constant";

/** The demo's keys. */
const K = INPUT_GROUP_DEMO_KEYS.demo_free.input_group.states;

/** Disabled and read-only keep the value. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <InputGroup label={t(K.required)} suffix="kg" isRequired />
      <InputGroup
        label={t(K.invalid)}
        suffix="kg"
        isInvalid
        errorMessage={t(K.invalid_message)}
        defaultValue="heavy"
      />
      <InputGroup label={t(K.disabled)} suffix="kg" isDisabled defaultValue="12" />
      <InputGroup label={t(K.read_only)} suffix="kg" isReadOnly defaultValue="12" />
    </View>
  );
}
