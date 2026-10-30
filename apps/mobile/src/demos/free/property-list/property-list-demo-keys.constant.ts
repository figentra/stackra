/**
 * Stackra file contract:
 * Purpose: `PROPERTY_LIST_DEMO_KEYS`, the typed keys of the native property-list demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The property-list demos' keys. */
export const PROPERTY_LIST_DEMO_KEYS = keys({
  demo_free: {
    property_list: {
      basics: ["customer", "order", "placed", "placed_value", "total"],
      copy: ["copied", "copy_email", "copy_id", "email", "none", "order_id"],
      elements: ["paid", "priority", "status", "tags"],
      empty: ["company", "custom", "discount", "gift", "not_set", "note"],
    },
  },
});
