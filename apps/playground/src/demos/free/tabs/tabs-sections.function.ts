/**
 * Stackra file contract:
 * Purpose: `tabsSections`, the three order sections most Tabs demos show, worded by the active translator.
 * Boundary: a pure function the tabs demos share; called inside a component, so the words follow the locale.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract).
 */
import type { TabItem } from "@stackra/ui/contracts";
import type { useCatalogueText } from "@stackra/ui/react";

import { TABS_KEYS } from "#src/routes/tabs/tabs-keys.constant";

/** The demos' section tabs. */
export function tabsSections(t: ReturnType<typeof useCatalogueText>): readonly TabItem[] {
  const K = TABS_KEYS.tabs.sections;
  return (["overview", "items", "history"] as const).map((id) => ({
    id,
    label: t(K[id].label),
    content: t(K[id].content),
  }));
}
