/**
 * Stackra file contract:
 * Purpose: the "rows" demo of the native ContextMenu: order rows whose actions open on a long press.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave C).
 */
import { ContextMenu, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CONTEXT_MENU_DEMO_KEYS } from "#src/demos/free/context-menu/context-menu-demo-keys.constant";

/** The demo's keys. */
const K = CONTEXT_MENU_DEMO_KEYS.demo_free.context_menu.rows;

/** Context menu: touch and hold an order row. */
export default function Rows() {
  const t = useCatalogueText(MESSAGES.en);
  const [chosen, setChosen] = useState("");
  const sections = [
    {
      id: "main",
      title: t(K.actions),
      isTitleHidden: true,
      items: [
        { id: "open", label: t(K.open) },
        { id: "duplicate", label: t(K.duplicate), icon: "copy" as const },
      ],
    },
    {
      id: "danger",
      title: t(K.danger),
      isTitleHidden: true,
      items: [
        { id: "delete", label: t(K.delete), icon: "trash" as const, tone: "danger" as const },
      ],
    },
  ];
  return (
    <View className="gap-2">
      <Text className="text-xs text-muted">{t(K.hint)}</Text>
      {["ORD-2048", "ORD-2049", "ORD-2050"].map((order) => (
        <ContextMenu
          key={order}
          label={t(K.label)}
          sections={sections}
          onAction={(id) => setChosen(`${order} · ${t(K[id as "open"])}`)}
        >
          <View className="rounded-[var(--radius-control)] border border-separator px-3 py-3">
            <Text>{order}</Text>
          </View>
        </ContextMenu>
      ))}
      <Text accessibilityLiveRegion="polite" className="text-sm text-muted">
        {chosen ? t(K.chosen, { action: chosen }) : ""}
      </Text>
    </View>
  );
}
