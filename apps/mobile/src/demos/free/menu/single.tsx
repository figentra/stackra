/**
 * Stackra file contract:
 * Purpose: the "single" demo of the native Menu: `selectionMode="single"` keeps one action chosen in each group.
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
const K = MENU_DEMO_KEYS.demo_free.menu.single;

/** One action chosen per group, marked with a check. */
export default function Single() {
  const [value, setValue] = useState<readonly string[]>(["newest"]);
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly MenuSection[] = [
    {
      id: "group",
      title: t(K.group),
      items: [
        { id: "newest", label: t(K.newest) },
        { id: "oldest", label: t(K.oldest) },
        { id: "price", label: t(K.price) },
      ],
    },
  ];
  return (
    <View className="items-start gap-3">
      <Menu sections={sections} selectionMode="single" value={value} onChange={setValue}>
        <Button variant="secondary">{t(K.open)}</Button>
      </Menu>
      <Text tone="muted" accessibilityLiveRegion="polite">
        {value.length === 0 ? t(K.none) : t(K.chosen, { keys: value.join(", ") })}
      </Text>
    </View>
  );
}
