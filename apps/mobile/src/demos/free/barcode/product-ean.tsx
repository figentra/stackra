/**
 * Stackra file contract:
 * Purpose: the "product-ean" demo of the native Barcode: a product's EAN-13, given as twelve digits, drawn with its
 *          check digit worked out, beside the product's name and price.
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
const K = BARCODE_DEMO_KEYS.demo_free.barcode.product_ean;

/** Barcode: a product's EAN-13. */
export default function ProductEan() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="gap-3">
      <View>
        <Text className="font-medium">{t(K.product)}</Text>
        <Text tone="muted" type="small">
          {t(K.price)}
        </Text>
      </View>
      <Barcode value="629104150021" format="ean13" label={t(K.label)} />
    </View>
  );
}
