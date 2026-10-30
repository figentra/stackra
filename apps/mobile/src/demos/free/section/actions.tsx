/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the native Section: the first action is primary; past three they go in a menu.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuLeafItem } from "@stackra/ui/contracts";
import { Section, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { SECTION_DEMO_KEYS } from "#src/demos/free/section/section-demo-keys.constant";

/** The demo's keys. */
const K = SECTION_DEMO_KEYS.demo_free.section.actions;

/** Three actions; the readout names the last one pressed. */
export default function Actions() {
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const actions: readonly MenuLeafItem[] = [
    { id: "add", label: t(K.add), icon: Icons.Plus, onPress: () => setLast("add") },
    { id: "edit", label: t(K.edit), icon: Icons.Pencil, onPress: () => setLast("edit") },
    {
      id: "remove",
      label: t(K.remove),
      icon: Icons.Trash,
      tone: "danger",
      onPress: () => setLast("remove"),
    },
  ];
  return (
    <View className="gap-3">
      <Section
        title={t(K.heading)}
        description={t(K.body)}
        actions={actions}
        moreActionsLabel={t(K.more_label)}
      >
        {t(K.content)}
      </Section>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {last === null ? t(K.none) : t(K.last, { id: last })}
      </Text>
    </View>
  );
}
