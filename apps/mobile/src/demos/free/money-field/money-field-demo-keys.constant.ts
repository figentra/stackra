/**
 * Stackra file contract:
 * Purpose: `MONEY_FIELD_DEMO_KEYS`, the typed keys of the native money-field demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The money-field demos' keys. */
export const MONEY_FIELD_DEMO_KEYS = keys({
  demo_free: {
    money_field: {
      basics: ["price", "price_hint", "stored"],
      currencies: ["amount", "currency", "currency_hint"],
      limit: ["refund", "refund_hint"],
    },
  },
});
