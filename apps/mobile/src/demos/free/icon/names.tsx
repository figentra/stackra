/**
 * Stackra file contract:
 * Purpose: the "names" demo of the native Icon: only the labelled icon is announced; the decorative one sits beside text.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { Icon, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { ICON_DEMO_KEYS } from "#src/demos/free/icon/icon-demo-keys.constant";

/** The demo's keys. */
const K = ICON_DEMO_KEYS.demo_free.icon.names;

/** Decorative beside its words, then labelled on its own. */
export default function Names() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2">
        <Icon name="user-round" />
        <Text>{t(K.profile)}</Text>
      </View>
      <Icon name="external-link" tone="accent" label={t(K.opens_outside)} />
    </View>
  );
}
