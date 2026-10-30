/**
 * Stackra file contract:
 * Purpose: `QR_CODE_DEMO_KEYS`, the typed keys of the native QR code demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const QR_CODE_DEMO_KEYS = keys({
  demo_free: {
    qr_code: { payment: ["label", "hint"], wifi: ["label"], arabic: ["label", "hint"] },
  },
});
