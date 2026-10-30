/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native CheckboxGroup: disabled, one option disabled, read-only, required and invalid.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { CheckboxGroup, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_DEMO_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_DEMO_KEYS.demo_free.checkbox_group;

/** One group per state; each label says what it shows. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const channels: readonly ChoiceOption[] = [
    { value: "email", label: t(K.channels.email) },
    { value: "sms", label: t(K.channels.sms), description: t(K.channels.sms_note) },
    { value: "push", label: t(K.channels.push) },
  ];
  // Format names are not translated.
  const formats: readonly ChoiceOption[] = [
    { value: "csv", label: "CSV" },
    { value: "xlsx", label: "Excel" },
    { value: "pdf", label: "PDF", isDisabled: true },
  ];
  const days: readonly ChoiceOption[] = [
    { value: "mon", label: t(K.days.mon) },
    { value: "wed", label: t(K.days.wed) },
    { value: "fri", label: t(K.days.fri) },
  ];
  return (
    <View className="gap-4">
      <CheckboxGroup
        label={t(K.states.disabled)}
        options={channels}
        isDisabled
        defaultValue={["email"]}
      />
      <CheckboxGroup label={t(K.states.option_disabled)} options={formats} />
      <CheckboxGroup
        label={t(K.states.read_only)}
        options={formats}
        isReadOnly
        defaultValue={["csv"]}
      />
      <CheckboxGroup label={t(K.states.required)} options={channels} isRequired />
      <CheckboxGroup
        label={t(K.states.invalid)}
        description={t(K.states.invalid_hint)}
        errorMessage={t(K.states.invalid_error)}
        options={days}
        isInvalid
      />
    </View>
  );
}
