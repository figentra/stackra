/**
 * Stackra file contract:
 * Purpose: the "wifi" demo of the native QR code: a guest network at level H, for a small printed card.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { QrCode, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { QR_CODE_DEMO_KEYS } from "#src/demos/free/qr-code/qr-code-demo-keys.constant";

/** The demo's keys. */
const K = QR_CODE_DEMO_KEYS.demo_free.qr_code.wifi;

/** QR code: a guest network at level H, for a small printed card. */
export default function Wifi() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <QrCode
        value="WIFI:T:WPA;S:Majlis-Guest;P:welcome2026;;"
        label={t(K.label)}
        size={120}
        level="H"
      />
    </View>
  );
}
