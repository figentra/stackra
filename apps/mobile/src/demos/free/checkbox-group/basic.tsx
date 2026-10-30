/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the native CheckboxGroup: a label, a description, and a second line on one option.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { CheckboxGroup, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_DEMO_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-demo-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_DEMO_KEYS.demo_free.checkbox_group;

/** Three channels, email checked. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  const channels: readonly ChoiceOption[] = [
    { value: "email", label: t(K.channels.email) },
    { value: "sms", label: t(K.channels.sms), description: t(K.channels.sms_note) },
    { value: "push", label: t(K.channels.push) },
  ];
  return (
    <CheckboxGroup
      label={t(K.basic.label)}
      description={t(K.basic.hint)}
      options={channels}
      defaultValue={["email"]}
    />
  );
}
