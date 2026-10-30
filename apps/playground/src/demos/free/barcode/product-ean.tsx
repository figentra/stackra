/**
 * Stackra file contract:
 * Purpose: the "product-ean" demo of the web Barcode: a product's EAN-13, given as twelve digits, drawn with its
 *          check digit worked out, beside the product's name and price.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Barcode, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BARCODE_KEYS } from "#src/demos/free/barcode/barcode-keys.constant";

/** The demo's keys. */
const K = BARCODE_KEYS.barcode.product_ean;

/** Barcode: a product's EAN-13. */
export default function ProductEan() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Barcode value="629104150021" format="ean13" label={t(K.label)} />
      <div className="grid">
        <Text className="font-medium">{t(K.product)}</Text>
        <Text tone="muted" type="small">
          {t(K.price)}
        </Text>
      </div>
    </div>
  );
}
