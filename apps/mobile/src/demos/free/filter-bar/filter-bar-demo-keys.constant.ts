/**
 * Stackra file contract:
 * Purpose: `FILTER_BAR_DEMO_KEYS`, the typed keys of the native filter-bar demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The filter-bar demos' keys. */
export const FILTER_BAR_DEMO_KEYS = keys({
  demo_free: {
    filter_bar: {
      bar: ["search_label", "search_placeholder"],
      readout: ["search", "no_search", "filters", "no_filters", "range", "yes", "no"],
      filters: [
        "customer",
        "customer_hint",
        "total",
        "status",
        "paid",
        "pending",
        "refunded",
        "channels",
        "web",
        "store",
        "phone",
        "placed",
        "gift",
        "gift_yes",
        "gift_no",
        "region",
      ],
    },
  },
});
