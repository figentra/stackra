/**
 * Stackra file contract:
 * Purpose: the "states" demo of the native Tabs: a refused tab (Billing), then `isDisabled` on every tab.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import type { TabItem } from "@stackra/ui/contracts";
import { Tabs, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { TABS_DEMO_KEYS } from "#src/demos/free/tabs/tabs-demo-keys.constant";

/** The demo's keys. */
const S = TABS_DEMO_KEYS.demo_free.tabs.sections;
const K = TABS_DEMO_KEYS.demo_free.tabs.states;

/** A tab can be shown and refused. */
export default function States() {
  const t = useCatalogueText(MESSAGES.en);
  const sections: readonly TabItem[] = [
    { id: "overview", label: t(S.overview), content: t(S.overview_body) },
    { id: "items", label: t(S.items), content: t(S.items_body) },
    { id: "history", label: t(S.history), content: t(S.history_body) },
  ];
  const settings: readonly TabItem[] = [
    { id: "profile", label: t(K.profile), content: t(K.profile_body) },
    { id: "billing", label: t(K.billing), content: t(K.billing_body), isDisabled: true },
    { id: "security", label: t(K.security), content: t(K.security_body) },
  ];
  return (
    <View className="gap-3">
      <Tabs label={t(K.label)} items={settings} />
      <Text type="small" tone="muted">
        {t(K.disabled)}
      </Text>
      <Tabs label={t(K.disabled_label)} items={sections} isDisabled />
    </View>
  );
}
