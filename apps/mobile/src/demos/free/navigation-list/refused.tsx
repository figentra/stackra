/**
 * Stackra file contract:
 * Purpose: the "refused" demo of the native NavigationList: `isDisabled` shows a place but refuses it.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { NavigationItem } from "@stackra/ui/contracts";
import { NavigationList, useCatalogueText } from "@stackra/ui/native";

import { MESSAGES } from "#src/constants/messages.constant";
import { NAVIGATION_LIST_DEMO_KEYS } from "#src/demos/free/navigation-list/navigation-list-demo-keys.constant";

/** The demo's keys. */
const K = NAVIGATION_LIST_DEMO_KEYS.demo_free.navigation_list.places;

/** The places do nothing when pressed: the demo shows the list, not the screens. */
const ignore = (): undefined => undefined;

/** The NavigationList demo: Billing is refused. */
export default function Refused() {
  const t = useCatalogueText(MESSAGES.en);
  const places: readonly NavigationItem[] = [
    { id: "profile", label: t(K.profile), onPress: ignore },
    { id: "billing", label: t(K.billing), isDisabled: true, onPress: ignore },
    { id: "security", label: t(K.security), onPress: ignore },
  ];
  return <NavigationList items={places} />;
}
