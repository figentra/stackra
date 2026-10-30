/**
 * Stackra file contract:
 * Purpose: the "info" demo of the native Contextual help: the "i" variant gives a background fact about the shift's opening cash.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6).
 */
import { ContextualHelp, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { CONTEXTUAL_HELP_DEMO_KEYS } from "#src/demos/free/contextual-help/contextual-help-demo-keys.constant";

/** The demo's keys. */
const K = CONTEXTUAL_HELP_DEMO_KEYS.demo_free.contextual_help.sample;

/** Contextual help: Info. */
export default function Info() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-1">
      <Text className="font-medium">{t(K.float_heading)}</Text>
      <ContextualHelp label={t(K.float_label)} variant="info">
        {t(K.float_body)}
      </ContextualHelp>
    </View>
  );
}
