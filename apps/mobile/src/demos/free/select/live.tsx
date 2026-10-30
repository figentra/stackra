/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Select: the chosen key, and Clear sets the value to null from outside.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SelectItem } from "@stackra/ui/contracts";
import { Button, Select, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SELECT_DEMO_KEYS } from "#src/demos/free/select/select-demo-keys.constant";

/** The demo's keys. */
const K = SELECT_DEMO_KEYS.demo_free.select.live;
const S = SELECT_DEMO_KEYS.demo_free.select.statuses;

/** A controlled select. */
export default function Live() {
  const [chosen, setChosen] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const statuses: readonly SelectItem[] = [
    { id: "draft", label: t(S.draft) },
    { id: "sent", label: t(S.sent) },
    { id: "paid", label: t(S.paid) },
    { id: "void", label: t(S.void), isDisabled: true },
  ];
  return (
    <View className="items-start gap-3">
      <Select label={t(K.label)} items={statuses} value={chosen} onChange={setChosen} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {chosen === null ? t(K.none) : t(K.chosen, { key: chosen })}
      </Text>
      <Button size="sm" variant="tertiary" onPress={() => setChosen(null)}>
        {t(K.clear)}
      </Button>
    </View>
  );
}
