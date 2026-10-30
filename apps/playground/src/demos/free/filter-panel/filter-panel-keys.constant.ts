/**
 * Stackra file contract:
 * Purpose: `FILTER_PANEL_KEYS`, the typed keys of the web filter-panel demos' words in `assets/lang/<locale>/filter_panel.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The filter_panel namespace's keys. */
export const FILTER_PANEL_KEYS = keys({
  filter_panel: {
    orders: [
      "label",
      "status",
      "paid",
      "unpaid",
      "refunded",
      "channel",
      "online",
      "in_store",
      "total",
      "all",
      "view_unpaid",
      "view_refunds",
      "date",
      "customer",
    ],
    products: ["label", "category", "drinks", "food", "merch", "in_stock", "price", "name"],
    tickets: ["label", "priority", "high", "normal", "low", "mine", "open", "view_mine", "closed"],
  },
});
