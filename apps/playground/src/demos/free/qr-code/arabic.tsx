/**
 * Stackra file contract:
 * Purpose: the "arabic" demo of the web QR code: in Arabic the caption reads from the right; the code itself never mirrors.
 * Boundary: a demo with no props, @stackra/ui and local state only; the same file is the preview and the code shown.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0302 (decisions 3 and 5);
 *          ADR 0060 (light, dark, RTL); STA-1371 (wave A, owner request 2026-10-29).
 */
import { QrCode, useCatalogueText } from "@stackra/ui/react";
import { MESSAGES } from "#src/constants/messages.constant";
import { QR_CODE_KEYS } from "#src/demos/free/qr-code/qr-code-keys.constant";

/** The demo's keys. */
const K = QR_CODE_KEYS.qr_code.arabic;

/** QR code: in Arabic the caption reads from the right; the code itself never mirrors. */
export default function Arabic() {
  const t = useCatalogueText(MESSAGES.en);
  return (
    <div dir="rtl" lang="ar" className="w-full max-w-md">
      <div className="grid justify-items-start gap-2">
        <QrCode
          value="https://pay.example.sa/i/INV-2207?amount=3450.00&currency=SAR"
          label={t(K.label)}
        />
        <p className="m-0 text-sm text-muted">{t(K.hint)}</p>
      </div>
    </div>
  );
}
