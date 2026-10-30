/**
 * Stackra file contract:
 * Purpose: the "actions" demo of the native PageHeader: the first action is primary; past three they go in a menu.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuLeafItem } from "@stackra/ui/contracts";
import { PageHeader, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { PAGE_HEADER_DEMO_KEYS } from "#src/demos/free/page-header/page-header-demo-keys.constant";

/** The demo's keys. */
const K = PAGE_HEADER_DEMO_KEYS.demo_free.page_header.actions;

/** Five actions; the readout names the last one pressed. */
export default function Actions() {
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const actions: readonly MenuLeafItem[] = [
    { id: "send", label: t(K.send), icon: Icons.SendHorizontal, onPress: () => setLast("send") },
    {
      id: "download",
      label: t(K.download),
      icon: Icons.Download,
      onPress: () => setLast("download"),
    },
    { id: "edit", label: t(K.edit), icon: Icons.Pencil, onPress: () => setLast("edit") },
    {
      id: "duplicate",
      label: t(K.duplicate),
      icon: Icons.Copy,
      onPress: () => setLast("duplicate"),
    },
    {
      id: "delete",
      label: t(K.delete),
      icon: Icons.Trash,
      tone: "danger",
      onPress: () => setLast("delete"),
    },
  ];
  return (
    <View className="gap-3">
      <PageHeader
        title={t(K.heading)}
        description={t(K.body)}
        actions={actions}
        moreActionsLabel={t(K.more_label)}
      />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {last === null ? t(K.none) : t(K.last, { id: last })}
      </Text>
    </View>
  );
}
