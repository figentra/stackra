/**
 * Stackra file contract:
 * Purpose: the "basic" demo of the web Checkbox group: A label, a description under it, and a description under one
 *          of the options.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0303 (decision 7); ADR 0060 (light, dark, RTL).
 */
import type { ChoiceOption } from "@stackra/ui/contracts";
import { CheckboxGroup as UiCheckboxGroup, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { CHECKBOX_GROUP_KEYS } from "#src/demos/free/checkbox-group/checkbox-group-keys.constant";

/** The demo's keys. */
const K = CHECKBOX_GROUP_KEYS.checkbox_group;

/** Checkbox group: A group. */
export default function Basic() {
  const t = useCatalogueText(MESSAGES.en);
  /** The channels of the first group; the email option carries a description. */
  const CHANNELS: readonly ChoiceOption[] = [
    { value: "email", label: t(K.sample.email), description: t(K.sample.a_weekly_digest) },
    { value: "sms", label: t(K.sample.text_message) },
    { value: "push", label: t(K.sample.push_notification) },
  ];
  return (
    <UiCheckboxGroup
      label={t(K.group_labels.basic)}
      description={t(K.basic_description)}
      options={CHANNELS}
      defaultValue={["email"]}
    />
  );
}
