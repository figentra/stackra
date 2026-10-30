/**
 * Stackra file contract:
 * Purpose: the "field" demo of the native Contextual help: help beside a field's label explains the SKU format with a sample SKU.
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

/** Contextual help: Beside a field. */
export default function Field() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-1">
      <Text type="small" className="font-medium">
        {t(K.sku_label_text)}
      </Text>
      <ContextualHelp label={t(K.sku_label)} title={t(K.sku_title)} placement="top">
        <Text type="small">
          {t(K.sku_body)} {"\u2066"}
          {t(K.sku_example)}
          {"\u2069"}
        </Text>
      </ContextualHelp>
    </View>
  );
}
