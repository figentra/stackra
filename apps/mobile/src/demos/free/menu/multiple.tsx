/**
 * Stackra file contract:
 * Purpose: the "multiple" demo of the native Menu: `selectionMode="multiple"` lets any number of actions stay chosen.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { MenuSection } from "@stackra/ui/contracts";
import { Button, Menu, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { MENU_DEMO_KEYS } from "#src/demos/free/menu/menu-demo-keys.constant";

/** The demo's keys. */
const K = MENU_DEMO_KEYS.demo_free.menu.multiple;

/** Any number of actions stay chosen. */
export default function Multiple() {
  const [value, setValue] = useState<readonly string[]>(["name", "status"]);
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "group",
      title: t(K.group),
      items: [
        { id: "name", label: t(K.name) },
        { id: "status", label: t(K.status) },
        { id: "total", label: t(K.total) },
      ],
    },
  ];
  return (
    <View className="items-start gap-3">
      <Menu sections={sections} selectionMode="multiple" value={value} onChange={setValue}>
        <Button variant="secondary">{t(K.open)}</Button>
      </Menu>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {value.length === 0 ? t(K.none) : t(K.chosen, { keys: value.join(", ") })}
      </Text>
    </View>
  );
}
