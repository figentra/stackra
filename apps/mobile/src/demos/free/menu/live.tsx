/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native Menu: `onAction` and a readout of the last action chosen.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_DEMO_KEYS } from "#src/demos/free/menu/menu-demo-keys.constant";

/** The demo's keys. */
const I = MENU_DEMO_KEYS.demo_free.menu.items;
const K = MENU_DEMO_KEYS.demo_free.menu.live;

/** Choose an action; the readout names it. */
export default function Live() {
  const [last, setLast] = useState<string | null>(null);
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "file",
      title: t(I.group),
      isTitleHidden: true,
      items: [
        { id: "edit", label: t(I.edit), description: t(I.edit_note), icon: Icons.Pencil },
        { id: "duplicate", label: t(I.duplicate), icon: Icons.Copy },
        {
          id: "archive",
          label: t(I.archive),
          icon: Icons.Archive,
          isDisabled: true,
          disabledReason: t(I.archive_reason),
        },
        { id: "delete", label: t(I.delete), icon: Icons.Trash, tone: "danger" },
      ],
    },
  ];
  return (
    <View className="items-start gap-3">
      <Menu sections={sections} onAction={setLast}>
        <Button variant="secondary">{t(K.open)}</Button>
      </Menu>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {last === null ? t(K.none) : t(K.last, { id: last })}
      </Text>
    </View>
  );
}
