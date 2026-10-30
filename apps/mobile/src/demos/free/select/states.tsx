/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Select: with a value, required, invalid, disabled and read-only.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { Select, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_DEMO_KEYS } from "#src/demos/free/select/select-demo-keys.constant";

/** The demo's keys. */
const K = SELECT_DEMO_KEYS.demo_free.select.states;
const S = SELECT_DEMO_KEYS.demo_free.select.statuses;

/** Read-only never opens. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const statuses: readonly SelectItem[] = [
    { id: "draft", label: t(S.draft) },
    { id: "sent", label: t(S.sent) },
    { id: "paid", label: t(S.paid) },
    { id: "void", label: t(S.void), isDisabled: true },
  ];
  return (
    <View className="gap-4">
      <Select label={t(K.with_value)} items={statuses} defaultValue="sent" />
      <Select label={t(K.required)} items={statuses} isRequired />
      <Select label={t(K.invalid)} items={statuses} isInvalid errorMessage={t(K.invalid_error)} />
      <Select label={t(K.disabled)} items={statuses} isDisabled defaultValue="paid" />
      <Select label={t(K.read_only)} items={statuses} isReadOnly defaultValue="paid" />
    </View>
  );
}
