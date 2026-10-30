/**
 * Stackra file contract:
 * Purpose: the "variants" demo of the native Tabs: `variant`, the selected tab as a raised pill or a flat one.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { TabItem } from "@stackra/ui/contracts";
import { Tabs, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABS_DEMO_KEYS } from "#src/demos/free/tabs/tabs-demo-keys.constant";

/** The demo's keys. */
const S = TABS_DEMO_KEYS.demo_free.tabs.sections;
const K = TABS_DEMO_KEYS.demo_free.tabs.variants;

/** Primary, then secondary. */
export default function Variants() {
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly TabItem[] = [
    { id: "overview", label: t(S.overview), content: t(S.overview_body) },
    { id: "items", label: t(S.items), content: t(S.items_body) },
    { id: "history", label: t(S.history), content: t(S.history_body) },
  ];
  return (
    <View className="gap-4">
      <Tabs label={t(K.label, { variant: "primary" })} items={sections} variant="primary" />
      <Tabs label={t(K.label, { variant: "secondary" })} items={sections} variant="secondary" />
    </View>
  );
}
