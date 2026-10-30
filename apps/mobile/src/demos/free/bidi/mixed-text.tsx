/**
 * Stackra file contract:
 * Purpose: the "mixed-text" demo of the native Bidi: a POS customer card whose phone, e-mail and SKU keep their order in
 *          Arabic, and a sentence that isolates the SKU it interpolates with `isolateText`.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0310 (decision 6); ADR 0060.
 */
import { isolateText } from "@stackra/ui";
import { Bidi, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BIDI_DEMO_KEYS } from "#src/demos/free/bidi/bidi-demo-keys.constant";

/** The demo's keys. */
const K = BIDI_DEMO_KEYS.demo_free.bidi.mixed_text;

/** A customer's details as the POS stores them (data, never translated). */
const CUSTOMER = {
  name: "ليلى أحمد",
  phone: "+966 55 123 4567",
  email: "layla.ahmed@example.com",
  sku: "SKU-104-B",
} as const;

/** Each detail, labelled, with its value isolated. */
export default function MixedText() {
  const t = useCatalogueText(MESSAGES.en);
  const rows = [
    [t(K.customer), CUSTOMER.name, "auto"],
    [t(K.phone), CUSTOMER.phone, "ltr"],
    [t(K.email), CUSTOMER.email, "ltr"],
    [t(K.sku), CUSTOMER.sku, "ltr"],
  ] as const;
  return (
    <View className="gap-3">
      {rows.map(([label, value, dir]) => (
        <Text key={label}>
          <Text tone="muted">{label}: </Text>
          <Bidi dir={dir}>{value}</Bidi>
        </Text>
      ))}
      <Text>{t(K.order_ready, { sku: isolateText(CUSTOMER.sku, "ltr") })}</Text>
    </View>
  );
}
