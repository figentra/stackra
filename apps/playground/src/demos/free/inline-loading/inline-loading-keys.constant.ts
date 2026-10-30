/**
 * Stackra file contract:
 * Purpose: `INLINE_LOADING_KEYS`, the typed keys of the web InlineLoading demos' words in `assets/lang/<locale>/inline_loading.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The inline_loading namespace's keys. */
export const INLINE_LOADING_KEYS = keys({
  inline_loading: [
    "charge",
    "charging",
    "paid",
    "declined",
    "decline_next",
    "total",
    "row_price",
    "save",
    "saving",
    "saved",
    "states",
  ],
});
