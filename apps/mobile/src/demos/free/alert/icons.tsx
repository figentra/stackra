/**
 * Stackra file contract:
 * Purpose: the "icons" demo of the native Alert: `icon` by name instead of the tone's, and `false` for none.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Alert, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ALERT_DEMO_KEYS } from "#src/demos/free/alert/alert-demo-keys.constant";

/** The demo's keys. */
const K = ALERT_DEMO_KEYS.demo_free.alert.icons;

/** A bell instead of the tone's icon, and no icon at all. */
export default function Icons() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <Alert tone="accent" icon="bell" title={t(K.custom)} />
      <Alert tone="warning" icon={false} title={t(K.none)} />
    </View>
  );
}
