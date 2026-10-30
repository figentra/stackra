/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Morph tabs: four icon tabs whose chosen one shows its name.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { SegmentItem } from "@stackra/ui/contracts";
import { MorphTabs, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MORPH_TABS_DEMO_KEYS } from "#src/demos/free/morph-tabs/morph-tabs-demo-keys.constant";

/** The demo's keys. */
const K = MORPH_TABS_DEMO_KEYS.demo_free.morph_tabs.sample;

/** Morph tabs: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const items: readonly SegmentItem[] = [
    { id: "home", label: t(K.home), icon: Icons.House },
    { id: "orders", label: t(K.orders), icon: Icons.Inbox },
    { id: "menu", label: t(K.menu), icon: Icons.BookOpen },
    { id: "settings", label: t(K.settings), icon: Icons.Settings },
  ];
  const [tab, setTab] = useState("home");
  return (
    <View className="items-start gap-3">
      <MorphTabs label={t(K.label)} items={items} selectedKey={tab} onSelectionChange={setTab} />
      <Text type="small" tone="muted">
        {t(K.showing, { tab: items.find((item) => item.id === tab)?.label ?? "" })}
      </Text>
    </View>
  );
}
