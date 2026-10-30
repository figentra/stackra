/**
 * Stackra file contract:
 * Purpose: the "groups" demo of the native NavigationList: `children` with no handler make a heading; with one, a link.
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
const G = NAVIGATION_LIST_DEMO_KEYS.demo_free.navigation_list.groups;

/** The places do nothing when pressed: the demo shows the list, not the screens. */
const ignore = (): undefined => undefined;

/** The NavigationList demo: Account is a heading; Settings is a link with places under it. */
export default function Groups() {
  const t = useCatalogueText(MESSAGES.en);
  const places: readonly NavigationItem[] = [
    { id: "home", label: t(K.home), icon: Icons.LayoutGrid, onPress: ignore },
    {
      id: "account",
      label: t(K.account),
      children: [
        { id: "profile", label: t(K.profile), onPress: ignore },
        { id: "security", label: t(K.security), onPress: ignore },
      ],
    },
    {
      id: "settings",
      label: t(K.settings),
      icon: Icons.Settings,
      onPress: ignore,
      children: [
        { id: "general", label: t(K.general), onPress: ignore },
        { id: "notifications", label: t(K.notifications), onPress: ignore },
      ],
    },
  ];
  return <NavigationList items={places} label={t(G.named)} />;
}
