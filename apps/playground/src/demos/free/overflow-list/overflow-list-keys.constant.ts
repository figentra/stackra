/**
 * Stackra file contract:
 * Purpose: `OVERFLOW_LIST_KEYS`, the typed keys of the web Overflow list demos' words in `assets/lang/<locale>/overflow_list.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The overflow_list namespace's keys. */
export const OVERFLOW_LIST_KEYS = keys({
  overflow_list: {
    tags: ["label", "vegan", "spicy", "gluten_free", "halal", "new", "best_seller"],
    roles: ["label", "cashier", "shift_lead", "inventory", "refunds"],
    channels: ["label", "online", "pos", "marketplace", "wholesale", "kiosk"],
  },
});
