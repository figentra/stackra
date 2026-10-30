/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Select: a label with a placeholder, and a label with a description.
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
const K = SELECT_DEMO_KEYS.demo_free.select.basics;
const S = SELECT_DEMO_KEYS.demo_free.select.statuses;
const M = SELECT_DEMO_KEYS.demo_free.select.methods;

/** Order status and shipping method. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const statuses: readonly SelectItem[] = [
    { id: "draft", label: t(S.draft) },
    { id: "sent", label: t(S.sent) },
    { id: "paid", label: t(S.paid) },
    { id: "void", label: t(S.void), isDisabled: true },
  ];
  const methods: readonly SelectItem[] = [
    { id: "post", label: t(M.post) },
    { id: "courier", label: t(M.courier) },
    { id: "pickup", label: t(M.pickup) },
  ];
  return (
    <View className="gap-4">
      <Select label={t(K.status)} placeholder={t(K.status_placeholder)} items={statuses} />
      <Select
        label={t(K.method)}
        description={t(K.hint)}
        placeholder={t(K.method_placeholder)}
        items={methods}
      />
    </View>
  );
}
