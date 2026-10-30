/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native RadioGroup: disabled, one option disabled, read-only, required and invalid.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { RadioGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { RADIO_GROUP_DEMO_KEYS } from "#src/demos/free/radio-group/radio-group-demo-keys.constant";

/** The demo's keys. */
const K = RADIO_GROUP_DEMO_KEYS.demo_free.radio_group;

/** One group per state; each label says what it shows. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const speeds: readonly ChoiceOption[] = [
    { value: "standard", label: t(K.speeds.standard), description: t(K.speeds.standard_note) },
    { value: "express", label: t(K.speeds.express) },
    { value: "overnight", label: t(K.speeds.overnight) },
  ];
  // Size letters are not translated.
  const sizes: readonly ChoiceOption[] = [
    { value: "s", label: "S" },
    { value: "m", label: "M" },
    { value: "l", label: "L" },
  ];
  const methods: readonly ChoiceOption[] = [
    { value: "card", label: t(K.methods.card) },
    { value: "transfer", label: t(K.methods.transfer) },
    { value: "cash", label: t(K.methods.cash), isDisabled: true },
  ];
  return (
    <View className="gap-4">
      <RadioGroup label={t(K.states.disabled)} options={sizes} isDisabled defaultValue="m" />
      <RadioGroup label={t(K.states.option_disabled)} options={methods} defaultValue="card" />
      <RadioGroup label={t(K.states.read_only)} options={sizes} isReadOnly defaultValue="l" />
      <RadioGroup label={t(K.states.required)} options={methods} isRequired />
      <RadioGroup
        label={t(K.states.invalid)}
        description={t(K.states.invalid_hint)}
        errorMessage={t(K.states.invalid_error)}
        options={speeds}
        isInvalid
      />
    </View>
  );
}
