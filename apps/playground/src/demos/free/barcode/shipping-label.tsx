/**
 * Stackra file contract:
 * Purpose: the "shipping-label" demo of the web Barcode: a parcel's Code 128 tracking code on a packing label with
 *          the order and the address.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Barcode, Card, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BARCODE_KEYS } from "#src/demos/free/barcode/barcode-keys.constant";

/** The demo's keys. */
const K = BARCODE_KEYS.barcode.shipping_label;

/** Barcode: a Code 128 shipping label. */
export default function ShippingLabel() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <Card className="grid w-fit gap-2 p-4">
      <Text className="font-semibold">{t(K.title)}</Text>
      <Text tone="muted" type="small">
        {t(K.to)}
      </Text>
      <Barcode value="SHP-2048-RUH" height={56} label={t(K.label)} />
    </Card>
  );
}
