/**
 * Stackra file contract:
 * Purpose: the "live" demo of the native NavigationList: a pressed place becomes the current one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { NavigationItem } from "@stackra/ui/contracts";
import { NavigationList, Text, useCatalogueText } from "@stackra/ui/native";
import { useState } from "react";
import { View } from "react-native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_LIST_DEMO_KEYS } from "#src/demos/free/navigation-list/navigation-list-demo-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_LIST_DEMO_KEYS.demo_free.navigation_list.places;
const L = NAVIGATION_LIST_DEMO_KEYS.demo_free.navigation_list.live;

/** The readout names the current place. */
export default function Live() {
  const [currentId, setCurrentId] = useState("inbox");
  const t = useCatalogueText(MESSAGES.en);
  const places: readonly NavigationItem[] = [
    { id: "home", label: t(K.home), icon: Icons.LayoutGrid },
    { id: "inbox", label: t(K.inbox), icon: Icons.Bell, badge: 3 },
    { id: "favourites", label: t(K.favourites), icon: Icons.Heart },
    { id: "settings", label: t(K.settings), icon: Icons.Settings },
  ].map((item) => ({
    ...item,
    isCurrent: item.id === currentId,
    onPress: () => setCurrentId(item.id),
  }));
  const current = places.find((item) => item.isCurrent)?.label ?? t(K.home);
  return (
    <View className="gap-3">
      <NavigationList items={places} />
      <Text tone="muted" accessibilityLiveRegion="polite">
        {t(L.current, { label: current })}
      </Text>
    </View>
  );
}
