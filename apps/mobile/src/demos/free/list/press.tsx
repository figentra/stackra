/**
 * Stackra file contract:
 * Purpose: the "press" demo of the native List: rows with `onPress` are buttons; Archived is shown but refused.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { ListItemData } from "@stackra/ui/contracts";
import { List, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { LIST_DEMO_KEYS } from "#src/demos/free/list/list-demo-keys.constant";

/** The demo's keys. */
const K = LIST_DEMO_KEYS.demo_free.list.press;

/** The readout names the last row opened. */
export default function Press() {
  const [opened, setOpened] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const projects: readonly ListItemData[] = [
    { id: "atlas", title: "Atlas", onPress: () => setOpened("Atlas") },
    { id: "borealis", title: "Borealis", onPress: () => setOpened("Borealis") },
    {
      id: "archived",
      title: t(K.archived),
      description: t(K.read_only),
      onPress: () => setOpened(t(K.archived)),
      isDisabled: true,
    },
  ];
  return (
    <View className="gap-3">
      <List scrollEnabled={false} label={t(K.label)} items={projects} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {opened === null ? t(K.none) : t(K.pressed, { title: opened })}
      </Text>
    </View>
  );
}
