/**
 * Stackra file contract:
 * Purpose: `MONEY_FIELD_KEYS`, the typed keys of the web Money field demos' words in `assets/lang/<locale>/money_field.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The money_field namespace's keys. */
export const MONEY_FIELD_KEYS = keys({
  money_field: [
    "price",
    "price_hint",
    "stored",
    "amount",
    "currency",
    "currency_hint",
    "refund",
    "refund_hint",
  ],
});
