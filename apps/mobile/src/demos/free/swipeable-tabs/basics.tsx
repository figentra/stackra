/**
 * Stackra file contract:
 * Purpose: the "basics" demo of the native Swipeable tabs: order statuses whose panels also change with a swipe.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { SwipeableTabs, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { SWIPEABLE_TABS_DEMO_KEYS } from "#src/demos/free/swipeable-tabs/swipeable-tabs-demo-keys.constant";

/** The demo's keys. */
const K = SWIPEABLE_TABS_DEMO_KEYS.demo_free.swipeable_tabs.sample;

/** Swipeable tabs: Basics. */
export default function Basics() {
  const t = useCatalogueText(MESSAGES.en);
  const panel = (body: string) => (
    <View className="gap-2 py-4">
      <Text>{body}</Text>
      <Text type="caption" tone="muted">
        {t(K.hint)}
      </Text>
    </View>
  );
  return (
    <SwipeableTabs
      label={t(K.label)}
      items={[
        { id: "new", label: t(K.new), content: panel(t(K.new_body)) },
        { id: "preparing", label: t(K.preparing), content: panel(t(K.preparing_body)) },
        { id: "ready", label: t(K.ready), content: panel(t(K.ready_body)) },
      ]}
    />
  );
}
