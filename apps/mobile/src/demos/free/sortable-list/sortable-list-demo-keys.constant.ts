/**
 * Stackra file contract:
 * Purpose: `SORTABLE_LIST_DEMO_KEYS`, the typed keys of the native sortable-list demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The sortable-list demos' keys. */
export const SORTABLE_LIST_DEMO_KEYS = keys({
  demo_free: {
    sortable_list: {
      menu: ["label", "order", "hot", "cold", "pastries", "sandwiches", "desserts", "items"],
      checkout: ["label", "step", "cart", "address", "shipping", "payment", "locked"],
      widgets: [
        "label",
        "lock",
        "unlock",
        "sales_today",
        "open_orders",
        "low_stock",
        "top_products",
      ],
    },
  },
});
