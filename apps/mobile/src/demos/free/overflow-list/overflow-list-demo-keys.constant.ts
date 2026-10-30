/**
 * Stackra file contract:
 * Purpose: `OVERFLOW_LIST_DEMO_KEYS`, the typed keys of the native overflow-list demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The overflow-list demos' keys. */
export const OVERFLOW_LIST_DEMO_KEYS = keys({
  demo_free: {
    overflow_list: {
      tags: ["label", "vegan", "spicy", "gluten_free", "halal", "new", "best_seller"],
      roles: ["label", "cashier", "shift_lead", "inventory", "refunds"],
      channels: ["label", "online", "pos", "marketplace", "wholesale", "kiosk"],
    },
  },
});
