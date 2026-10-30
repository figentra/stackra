/**
 * Stackra file contract:
 * Purpose: the "order-number" demo of the native CopyButton: an order number to paste into a support chat.
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
const K = COPY_BUTTON_DEMO_KEYS.demo_free.copy_button.order_number;

/** An order number (data, never translated). */
const ORDER = "ORD-2048-RUH";

/** The order number beside its copy button. */
export default function OrderNumber() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="flex-row items-center gap-2">
      <Text tone="muted">{t(K.order)}</Text>
      <Text className="font-mono">{ORDER}</Text>
      <CopyButton value={ORDER} size="sm" label={t(K.copy_order)} copiedLabel={t(K.order_copied)} />
    </View>
  );
}
