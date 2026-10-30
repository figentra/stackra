/**
 * Stackra file contract:
 * Purpose: the "invalid" demo of the native Barcode: an EAN-13 with the wrong check digit shows the error line in
 *          place of bars, with what is wrong under it.
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
const K = BARCODE_DEMO_KEYS.demo_free.barcode.invalid;

/** Barcode: an invalid value. */
export default function Invalid() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View className="items-start gap-2">
      <Barcode value="6291041500214" format="ean13" />
      <Text tone="muted" type="small">
        {t(K.caption)}
      </Text>
    </View>
  );
}
