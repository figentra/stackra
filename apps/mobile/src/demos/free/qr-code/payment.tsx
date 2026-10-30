/**
 * Stackra file contract:
 * Purpose: the "payment" demo of the native QR code: an invoice's payment link to scan with a banking app.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { QrCode, Text, useCatalogueText } from "@stackra/ui/native";
import { View } from "react-native";

import { MESSAGES } from "#src/constants/messages.constant";
import { QR_CODE_DEMO_KEYS } from "#src/demos/free/qr-code/qr-code-demo-keys.constant";

/** The demo's keys. */
const K = QR_CODE_DEMO_KEYS.demo_free.qr_code.payment;

/** QR code: an invoice's payment link to scan with a banking app. */
export default function Payment() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <View>
      <View className="items-start gap-2">
        <QrCode
          value="https://pay.example.sa/i/INV-2207?amount=3450.00&currency=SAR"
          label={t(K.label)}
        />
        <Text type="small" tone="muted">
          {t(K.hint)}
        </Text>
      </View>
    </View>
  );
}
