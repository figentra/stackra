/**
 * Stackra file contract:
 * Purpose: the "api-key" demo of the native CopyButton: a masked API key, copied whole.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6);
 *          design-system gap inventory row 35.
 */
import { CopyButton, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { COPY_BUTTON_DEMO_KEYS } from "#src/demos/free/copy-button/copy-button-demo-keys.constant";

/** The demo's keys. */
const K = COPY_BUTTON_DEMO_KEYS.demo_free.copy_button.api_key;

/** A sample test key (not a real secret). */
const KEY = "sk_test_DEMO_not_a_real_key";

/** The masked key and its copy button. */
export default function ApiKey() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-1">
      <Text type="small" tone="muted">
        {t(K.api_key)}
      </Text>
      <View className="flex-row items-center justify-between gap-2 border border-border bg-surface px-3 py-1">
        <Text className="font-mono" isTruncated>
          {`${KEY.slice(0, 8)}••••••••${KEY.slice(-4)}`}
        </Text>
        <CopyButton value={KEY} label={t(K.copy_key)} copiedLabel={t(K.key_copied)} />
      </View>
    </View>
  );
}
