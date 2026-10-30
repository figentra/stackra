/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the native EmptyState: `icon` by name instead of the reason's, and `false` for none.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { EmptyState, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { EMPTY_STATE_DEMO_KEYS } from "#src/demos/free/empty-state/empty-state-demo-keys.constant";

/** The demo's keys. */
const K = EMPTY_STATE_DEMO_KEYS.demo_free.empty_state.icons;

/** A bell, then no icon at all. */
export default function Icons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-4">
      <EmptyState headingLevel={3} icon="bell" title={t(K.custom)} description={t(K.custom_body)} />
      <EmptyState headingLevel={3} icon={false} title={t(K.none)} description={t(K.none_body)} />
    </View>
  );
}
