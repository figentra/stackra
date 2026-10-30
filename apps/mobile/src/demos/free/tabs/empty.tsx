/**
 * Stackra file contract:
 * Purpose: the "empty" demo of the native Tabs: `emptyState` with no tabs, and a spinner named by `loadingLabel`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { EmptyState, Tabs, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABS_DEMO_KEYS } from "#src/demos/free/tabs/tabs-demo-keys.constant";

/** The demo's keys. */
const K = TABS_DEMO_KEYS.demo_free.tabs.empty;

/** Empty, then loading. */
export default function Empty() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <Tabs
        label={t(K.label)}
        items={[]}
        emptyState={<EmptyState headingLevel={3} title={t(K.heading)} description={t(K.body)} />}
      />
      <Tabs label={t(K.loading_label)} items={[]} isLoading loadingLabel={t(K.loading)} />
    </View>
  );
}
