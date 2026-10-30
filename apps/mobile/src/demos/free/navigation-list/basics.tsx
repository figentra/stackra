/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native NavigationList: a row per place with an optional icon; a count is a `badge`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { NavigationItem } from "@stackra/ui/contracts";
import { NavigationList, useCatalogueText } from "@stackra/ui/native";

import { Icons } from "#src/constants/icons.constant";
import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_LIST_DEMO_KEYS } from "#src/demos/free/navigation-list/navigation-list-demo-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_LIST_DEMO_KEYS.demo_free.navigation_list.places;

/** Four places, one with a count. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  // The places only show how a link looks: their handler does nothing.
  const places: readonly NavigationItem[] = [
    { id: "home", label: t(K.home), icon: Icons.LayoutGrid, onPress: () => undefined },
    { id: "inbox", label: t(K.inbox), icon: Icons.Bell, badge: 3, onPress: () => undefined },
    { id: "favourites", label: t(K.favourites), icon: Icons.Heart, onPress: () => undefined },
    { id: "settings", label: t(K.settings), icon: Icons.Settings, onPress: () => undefined },
  ];
  return <NavigationList items={places} />;
}
