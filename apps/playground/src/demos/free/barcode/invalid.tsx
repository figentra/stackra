/**
 * Stackra file contract:
 * Purpose: the "invalid" demo of the web Barcode: an EAN-13 typed with the wrong check digit shows the error line in
 *          place of bars, with what is wrong under it.
 * Boundary: a demo with no props, @stackra/ui only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0060 (light, dark, RTL);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { Barcode, Text, useCatalogueText } from "@stackra/ui/react";

import { MESSAGES } from "#src/constants/messages.constant";
import { BARCODE_KEYS } from "#src/demos/free/barcode/barcode-keys.constant";

/** The demo's keys. */
const K = BARCODE_KEYS.barcode.invalid;

/** Barcode: an invalid value. */
export default function Invalid() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div className="grid justify-items-start gap-2">
      <Barcode value="6291041500214" format="ean13" />
      <Text tone="muted" type="small">
        {t(K.caption)}
      </Text>
    </div>
  );
}
