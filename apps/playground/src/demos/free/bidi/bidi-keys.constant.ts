/**
 * Stackra file contract:
 * Purpose: `BIDI_KEYS`, the typed keys of the web Bidi demos' words in `assets/lang/<locale>/bidi.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The bidi namespace's keys. */
export const BIDI_KEYS = keys({
  bidi: [
    "customer",
    "phone",
    "email",
    "sku",
    "order_ready",
    "transfer",
    "iban",
    "note",
    "note_value",
    "steps",
    "cart",
    "payment",
    "receipt",
    "next",
    "back",
    "step_of",
  ],
});
