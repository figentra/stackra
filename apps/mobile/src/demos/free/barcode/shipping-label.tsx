/**
 * Stackra file contract:
 * Purpose: the "shipping-label" demo of the native Barcode: a parcel's Code 128 tracking code under the order and the
 *          address.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decision 3); ADR 0060;
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Barcode, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { BARCODE_DEMO_KEYS } from "#src/demos/free/barcode/barcode-demo-keys.constant";

/** The demo's keys. */
const K = BARCODE_DEMO_KEYS.demo_free.barcode.shipping_label;

/** Barcode: a Code 128 shipping label. */
export default function ShippingLabel() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-2">
      <Text className="font-semibold">{t(K.title)}</Text>
      <Text tone="muted" type="small">
        {t(K.to)}
      </Text>
      <Barcode value="SHP-2048-RUH" height={56} label={t(K.label)} />
    </View>
  );
}
